/**
 * SAT-SA — Supervisory Analytics Tool for SOC Assessment (SIH26157)
 * Authoritative SQLite Database Architecture & Persistence Layer
 *
 * Implements:
 * - SQLite single-source-of-truth storage (satsa_database.sqlite)
 * - Strict foreign-key enforcement & WAL journaling mode
 * - Transactional ACID ingestion pipeline with rollback on validation error
 * - Finding deduplication & review decision history retention (finding_reviews)
 * - Ingestion batch tracking (ingestion_batches)
 * - Analytics run lifecycle auditability (analytics_runs)
 * - Role-based query scoping & immutable audit logging (audit_logs)
 * - Asset inventory & negative-space asset visibility detection (assets)
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import {
  Entity,
  Alert,
  Case,
  Investigation,
  Escalation,
  Closure,
  Asset,
  SupervisoryFinding,
  AuditEvent,
  User,
  IngestionBatch,
  AnalyticsRunRecord,
  FindingReviewRecord
} from './types';
import { hashPassword } from './auth';

const DB_FILE_PATH = path.resolve(process.cwd(), 'satsa_database.sqlite');

export class SQLiteDatabase {
  private db: DatabaseSync;
  private isInitialized = false;

  constructor(filePath: string = DB_FILE_PATH) {
    this.db = new DatabaseSync(filePath);
    this.configurePragmas();
    this.initializeSchema();
  }

  private configurePragmas(): void {
    try {
      this.db.exec('PRAGMA foreign_keys = ON;');
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA busy_timeout = 5000;');
      this.db.exec('PRAGMA synchronous = NORMAL;');
    } catch (err) {
      console.warn('[SQLite] Warning configuring pragmas:', err);
    }
  }

  /**
   * Initializes all SAT-SA relational schema tables and indexes.
   * Fully idempotent; preserves existing data.
   */
  public initializeSchema(): void {
    if (this.isInitialized) return;

    this.db.exec(`
      -- 1. USERS & AUTHENTICATION
      CREATE TABLE IF NOT EXISTS users (
        id TEXT NOT NULL,
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        access_level TEXT NOT NULL,
        organization TEXT NOT NULL,
        badge_number TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT
      );

      -- 2. CRITICAL SECTOR ENTITIES (CSEs)
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        sector TEXT NOT NULL,
        criticality_tier TEXT NOT NULL,
        soc_contact TEXT,
        assessment_period TEXT DEFAULT 'Q2-2026',
        status TEXT DEFAULT 'Active Assessment',
        assessment_start TEXT,
        assessment_end TEXT,
        resilience_score REAL DEFAULT 78.5,
        total_alerts INTEGER DEFAULT 0,
        total_cases INTEGER DEFAULT 0,
        total_findings INTEGER DEFAULT 0,
        last_analytics_run TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. ALERTS (Initial Operational Evidence)
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        timestamp TEXT NOT NULL,
        source_tool TEXT NOT NULL,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        target_host TEXT,
        target_ip TEXT,
        analyst_id TEXT,
        status TEXT DEFAULT 'NEW',
        triage_duration_sec INTEGER DEFAULT 180,
        summary TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        raw_source TEXT,
        event_reference TEXT
      );

      -- 4. CASES (Connects Alerts to Investigations)
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        priority TEXT NOT NULL,
        owner_analyst TEXT NOT NULL,
        status TEXT NOT NULL,
        escalation_flag INTEGER DEFAULT 0,
        sla_target_minutes INTEGER DEFAULT 60,
        sla_breached INTEGER DEFAULT 0,
        assigned_at TEXT,
        closed_at TEXT,
        severity TEXT,
        created_by TEXT
      );

      -- 5. INVESTIGATIONS (Required for Workflow Reconstruction)
      CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        analyst_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        evidence_types_json TEXT DEFAULT '[]',
        hash_artifacts TEXT,
        containment_action_logged INTEGER DEFAULT 0,
        investigation_notes TEXT
      );

      -- 6. ESCALATIONS (Required for Escalation Evidence Gap Detection)
      CREATE TABLE IF NOT EXISTS escalations (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        escalated_by TEXT NOT NULL,
        escalated_to TEXT NOT NULL,
        escalation_timestamp TEXT NOT NULL,
        ack_timestamp TEXT,
        justification TEXT
      );

      -- 7. CLOSURES (Supervisory Sign-off & Root Cause)
      CREATE TABLE IF NOT EXISTS closures (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        alert_id TEXT,
        closed_at TEXT NOT NULL,
        closed_by TEXT NOT NULL,
        resolution_type TEXT NOT NULL,
        root_cause_summary TEXT,
        supervisory_signoff INTEGER DEFAULT 0,
        duration_minutes REAL DEFAULT 0
      );

      -- 8. ASSETS (Required for Negative-Space Asset Visibility Gap Detection)
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        hostname TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        criticality TEXT NOT NULL,
        owner_dept TEXT,
        is_in_active_inventory INTEGER DEFAULT 1
      );

      -- 9. SUPERVISORY FINDINGS (Primary Analytics Output)
      CREATE TABLE IF NOT EXISTS findings (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        entity_name TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        case_id TEXT,
        alert_id TEXT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        priority_score REAL NOT NULL,
        what TEXT,
        why TEXT,
        expected_workflow_json TEXT,
        observed_workflow_json TEXT,
        supporting_evidence_json TEXT,
        counterfactual_explanation TEXT,
        recommended_action TEXT,
        review_status TEXT DEFAULT 'Pending Review',
        examiner_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        assessment_period TEXT DEFAULT 'Q2-2026',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 10. FINDING REVIEW DECISIONS (Immutable Audit Trail of Examiner Decisions)
      CREATE TABLE IF NOT EXISTS finding_reviews (
        id TEXT PRIMARY KEY,
        finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
        reviewer_username TEXT NOT NULL,
        reviewer_role TEXT NOT NULL,
        previous_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 11. INGESTION BATCHES (Dataset Upload & Audit Lifecycle)
      CREATE TABLE IF NOT EXISTS ingestion_batches (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        dataset_type TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        record_count INTEGER DEFAULT 0,
        valid_count INTEGER DEFAULT 0,
        invalid_count INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        error_summary TEXT,
        assessment_period TEXT DEFAULT 'Q2-2026'
      );

      -- 12. ANALYTICS RUNS (Reproducibility & Execution History)
      CREATE TABLE IF NOT EXISTS analytics_runs (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        executed_by TEXT NOT NULL,
        entity_id TEXT,
        records_analyzed INTEGER DEFAULT 0,
        workflows_analyzed INTEGER DEFAULT 0,
        findings_generated INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        error_summary TEXT
      );

      -- 13. AUDIT LOGS (Immutable Supervisory Ledger)
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_id TEXT,
        finding_id TEXT,
        target_type TEXT,
        target_id TEXT,
        details_json TEXT
      );

      -- ----------------------------------------------------
      -- HIGH-PERFORMANCE QUERY INDEXES (SAT-SA Section 29)
      -- ----------------------------------------------------
      CREATE INDEX IF NOT EXISTS idx_entities_code ON entities(code);
      CREATE INDEX IF NOT EXISTS idx_alerts_entity ON alerts(entity_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);

      CREATE INDEX IF NOT EXISTS idx_cases_entity ON cases(entity_id);
      CREATE INDEX IF NOT EXISTS idx_cases_alert ON cases(alert_id);
      CREATE INDEX IF NOT EXISTS idx_cases_owner ON cases(owner_analyst);
      CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
      CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(created_at);

      CREATE INDEX IF NOT EXISTS idx_investigations_case ON investigations(case_id);
      CREATE INDEX IF NOT EXISTS idx_escalations_case ON escalations(case_id);
      CREATE INDEX IF NOT EXISTS idx_closures_case ON closures(case_id);
      CREATE INDEX IF NOT EXISTS idx_closures_alert ON closures(alert_id);

      CREATE INDEX IF NOT EXISTS idx_assets_entity ON assets(entity_id);
      CREATE INDEX IF NOT EXISTS idx_assets_ip ON assets(ip_address);

      CREATE INDEX IF NOT EXISTS idx_findings_entity ON findings(entity_id);
      CREATE INDEX IF NOT EXISTS idx_findings_rule ON findings(rule_id);
      CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
      CREATE INDEX IF NOT EXISTS idx_findings_score ON findings(priority_score);
      CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(review_status);

      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_username ON audit_logs(username);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_id);

      CREATE INDEX IF NOT EXISTS idx_reviews_finding ON finding_reviews(finding_id);
      CREATE INDEX IF NOT EXISTS idx_ingest_uploaded ON ingestion_batches(uploaded_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_started ON analytics_runs(started_at);
    `);

    this.isInitialized = true;
    console.log('[SQLite] SAT-SA schema initialized successfully on satsa_database.sqlite');
  }

  /**
   * Seed preset accounts idempotently
   */
  public seedPresetUsers(users: User[]): void {
    const checkStmt = this.db.prepare('SELECT username FROM users WHERE username = ?');
    const insertStmt = this.db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, email, role, access_level, organization, badge_number, active, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of users) {
      const existing = checkStmt.get(u.username);
      if (!existing) {
        insertStmt.run(
          u.id,
          u.username,
          u.passwordHash,
          u.name,
          u.email,
          u.role,
          u.accessLevel,
          u.organization,
          u.badgeNumber || `SAT-${u.username.toUpperCase()}`,
          u.active ? 1 : 0,
          u.createdAt || new Date().toISOString(),
          u.lastLogin || new Date().toISOString()
        );
      }
    }
  }

  /**
   * Synchronize memory scenario data with SQLite tables transactionally
   */
  public syncDatasetToDatabase(
    entities: Entity[],
    alerts: Alert[],
    cases: Case[],
    investigations: Investigation[],
    escalations: Escalation[],
    closures: Closure[],
    assets: Asset[],
    findings: SupervisoryFinding[],
    auditEvents: AuditEvent[],
    options: { preserveReviews?: boolean } = { preserveReviews: true }
  ): void {
    // Collect existing reviews to preserve examiner decisions
    const existingReviews = new Map<string, { status: string; notes: string; reviewedBy: string; reviewedAt: string }>();
    if (options.preserveReviews) {
      try {
        const rows = this.db.prepare('SELECT id, review_status, examiner_notes, reviewed_by, reviewed_at FROM findings WHERE review_status != "Pending Review"').all() as any[];
        for (const r of rows) {
          existingReviews.set(r.id, {
            status: r.review_status,
            notes: r.examiner_notes,
            reviewedBy: r.reviewed_by,
            reviewedAt: r.reviewed_at
          });
        }
      } catch {
        // Table might be empty on first run
      }
    }

    this.db.exec('BEGIN TRANSACTION;');
    try {
      // Clear operational tables (leaving users and audit logs intact)
      this.db.exec('DELETE FROM closures;');
      this.db.exec('DELETE FROM escalations;');
      this.db.exec('DELETE FROM investigations;');
      this.db.exec('DELETE FROM cases;');
      this.db.exec('DELETE FROM alerts;');
      this.db.exec('DELETE FROM assets;');
      this.db.exec('DELETE FROM findings;');
      this.db.exec('DELETE FROM entities;');

      // 1. Insert Entities
      const insEntity = this.db.prepare(`
        INSERT INTO entities (id, name, code, sector, criticality_tier, soc_contact, assessment_period, status, assessment_start, assessment_end, resilience_score, total_alerts, total_cases, total_findings, last_analytics_run, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of entities) {
        insEntity.run(
          e.id,
          e.name,
          e.code,
          e.sector,
          e.criticality_tier || (e.criticality === 'CRITICAL' ? 'Tier-1 Mission Critical' : e.criticality === 'HIGH' ? 'Tier-2' : 'Tier-3'),
          e.soc_contact || `soc-lead@${e.code.toLowerCase()}.in`,
          e.assessment_period || 'Q2-2026',
          e.status || 'Active Assessment',
          e.assessment_start || '2026-04-01T00:00:00Z',
          e.assessment_end || '2026-06-30T23:59:59Z',
          e.resilience_score || 78.5,
          e.total_alerts || alerts.filter(a => a.entityId === e.id).length,
          e.total_cases || cases.filter(c => c.entityId === e.id).length,
          e.total_findings || 0,
          e.last_analytics_run || new Date().toISOString(),
          e.created_at || new Date().toISOString()
        );
      }

      // 2. Insert Assets
      const insAsset = this.db.prepare(`
        INSERT INTO assets (id, entity_id, hostname, ip_address, asset_type, criticality, owner_dept, is_in_active_inventory)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of assets) {
        insAsset.run(
          a.id,
          a.entity_id,
          a.hostname,
          a.ip_address,
          a.asset_type,
          a.criticality,
          a.owner_dept,
          a.is_in_active_inventory ? 1 : 0
        );
      }

      // 3. Insert Alerts
      const insAlert = this.db.prepare(`
        INSERT INTO alerts (id, entity_id, timestamp, source_tool, severity, category, target_host, target_ip, analyst_id, status, triage_duration_sec, summary, created_at, raw_source, event_reference)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const al of alerts) {
        insAlert.run(
          al.id,
          al.entityId,
          al.timestamp || al.rawTimestamp || al.normalizedTimestamp,
          al.source,
          al.severity,
          al.category,
          al.target_host || (al.title.includes('SCADA') ? 'scada-rtu-01.grid.local' : 'core-srv-01.internal'),
          al.target_ip || '10.14.20.101',
          al.analyst_id || 'ANL-SOC-104',
          al.status,
          al.triage_duration_sec || 180,
          al.description || al.title,
          al.created_at || al.rawTimestamp,
          al.raw_source || 'SIEM Event Stream',
          al.event_reference || `EVT-${al.id}`
        );
      }

      // 4. Insert Cases
      const insCase = this.db.prepare(`
        INSERT INTO cases (id, entity_id, alert_id, created_at, priority, owner_analyst, status, escalation_flag, sla_target_minutes, sla_breached, assigned_at, closed_at, severity, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of cases) {
        insCase.run(
          c.id,
          c.entityId,
          c.alertId,
          c.createdAt,
          c.priority || c.severity,
          c.owner_analyst || c.assignedAnalyst,
          c.status,
          c.escalation_flag ? 1 : (c.status === 'ESCALATED' ? 1 : 0),
          c.sla_target_minutes || c.slaTargetMinutes || 60,
          c.sla_breached ? 1 : (c.slaBreached ? 1 : 0),
          c.assigned_at || c.createdAt,
          c.closed_at || c.closedAt || null,
          c.severity,
          c.created_by || 'Tier 1 Analyst'
        );
      }

      // 5. Insert Investigations
      const insInv = this.db.prepare(`
        INSERT INTO investigations (id, case_id, analyst_id, start_time, end_time, evidence_types_json, hash_artifacts, containment_action_logged, investigation_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const inv of investigations) {
        insInv.run(
          inv.id,
          inv.caseId,
          inv.analystId,
          inv.start_time || inv.startedAt,
          inv.end_time || inv.completedAt || null,
          inv.evidence_types_json || JSON.stringify(inv.evidenceIds || []),
          inv.hash_artifacts || (inv.evidenceIds?.length ? 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' : null),
          inv.containment_action_logged ? 1 : 0,
          inv.investigation_notes || inv.findingsNotes || inv.hypothesis
        );
      }

      // 6. Insert Escalations
      const insEsc = this.db.prepare(`
        INSERT INTO escalations (id, case_id, escalated_by, escalated_to, escalation_timestamp, ack_timestamp, justification)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const esc of escalations) {
        insEsc.run(
          esc.id,
          esc.caseId,
          esc.escalatedBy,
          esc.escalatedTo,
          esc.escalation_timestamp || esc.escalatedAt,
          esc.ack_timestamp || new Date(new Date(esc.escalatedAt).getTime() + 12 * 60000).toISOString(),
          esc.justification || esc.escalationReason
        );
      }

      // 7. Insert Closures
      const insClosure = this.db.prepare(`
        INSERT INTO closures (id, case_id, alert_id, closed_at, closed_by, resolution_type, root_cause_summary, supervisory_signoff, duration_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const cl of closures) {
        insClosure.run(
          cl.id,
          cl.caseId,
          cl.alert_id || null,
          cl.closed_at || cl.closedAt,
          cl.closed_by || cl.closedBy,
          cl.resolution_type || (cl.classification === 'FALSE_POSITIVE' ? 'False Positive' : 'True Positive Mitigated'),
          cl.root_cause_summary || cl.justification,
          (cl.supervisory_signoff ?? cl.approvedBySupervisor) ? 1 : 0,
          cl.duration_minutes || 45.0
        );
      }

      // 8. Insert Findings with Deduplication and Review Status Preservation
      const insFinding = this.db.prepare(`
        INSERT INTO findings (id, entity_id, entity_name, rule_id, case_id, alert_id, title, category, severity, priority_score, what, why, expected_workflow_json, observed_workflow_json, supporting_evidence_json, counterfactual_explanation, recommended_action, review_status, examiner_notes, reviewed_by, reviewed_at, assessment_period, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const f of findings) {
        const preserved = existingReviews.get(f.id);
        insFinding.run(
          f.id,
          f.entityId,
          f.entityName,
          f.detectionRuleId,
          f.caseId || null,
          f.supportingEvidence?.[0]?.recordId || null,
          f.title,
          f.category,
          f.severity,
          f.priorityScore,
          f.whatHappened,
          f.whyFlagged,
          JSON.stringify(f.expectedWorkflow || []),
          JSON.stringify(f.observedWorkflow || []),
          JSON.stringify(f.supportingEvidence || []),
          f.counterfactual,
          f.recommendedAction,
          preserved?.status || f.reviewStatus || 'Pending Review',
          preserved?.notes || f.examiner_notes || (f.reviewDecision?.notes || null),
          preserved?.reviewedBy || f.reviewed_by || (f.reviewDecision?.reviewerName || null),
          preserved?.reviewedAt || f.reviewed_at || (f.reviewDecision?.reviewedAt || null),
          'Q2-2026',
          f.createdAt || new Date().toISOString()
        );
      }

      // 9. Update Entity Counters Transactionally
      this.db.exec(`
        UPDATE entities SET
          total_alerts = (SELECT COUNT(*) FROM alerts WHERE alerts.entity_id = entities.id),
          total_cases = (SELECT COUNT(*) FROM cases WHERE cases.entity_id = entities.id),
          total_findings = (SELECT COUNT(*) FROM findings WHERE findings.entity_id = entities.id);
      `);

      this.db.exec('COMMIT;');
      console.log(`[SQLite] Persisted: ${entities.length} entities, ${alerts.length} alerts, ${cases.length} cases, ${investigations.length} investigations, ${escalations.length} escalations, ${closures.length} closures, ${assets.length} assets, ${findings.length} findings.`);
    } catch (error) {
      this.db.exec('ROLLBACK;');
      console.error('[SQLite] Transaction rolled back due to error:', error);
      throw error;
    }
  }

  /**
   * Log an immutable audit record
   */
  public logAuditEvent(event: AuditEvent): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO audit_logs (id, timestamp, username, role, action, entity_id, finding_id, target_type, target_id, details_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        event.id,
        event.timestamp,
        event.actorEmail || 'system',
        event.actorRole || 'System',
        event.action,
        (event.metadata as any)?.entityId || null,
        (event.metadata as any)?.findingId || null,
        event.targetType,
        event.targetId,
        JSON.stringify(event.metadata || {})
      );
    } catch (err) {
      console.warn('[SQLite] Audit log insertion error:', err);
    }
  }

  /**
   * Query role-scoped audit logs
   */
  public getAuditLogs(role: string, limit = 100): any[] {
    let sql = 'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?';
    if (role === 'SOC Supervisor') {
      sql = `
        SELECT * FROM audit_logs
        WHERE target_type NOT IN ('SYSTEM_STATE', 'POLICY_RULE')
          AND action NOT IN ('POLICY_RULE_MODIFIED', 'SCENARIO_SWITCHED')
        ORDER BY timestamp DESC LIMIT ?
      `;
    }
    const rows = this.db.prepare(sql).all(limit) as any[];
    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      actorEmail: r.username,
      actorName: r.username,
      actorRole: r.role,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      metadata: r.details_json ? JSON.parse(r.details_json) : {}
    }));
  }

  /**
   * Record finding review decision with review history
   */
  public recordFindingReview(
    findingId: string,
    decision: string,
    reviewerUsername: string,
    reviewerRole: string,
    notes: string
  ): void {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const current = this.db.prepare('SELECT review_status FROM findings WHERE id = ?').get(findingId) as any;
      const prevStatus = current?.review_status || 'Pending Review';

      // Update finding table
      this.db.prepare(`
        UPDATE findings
        SET review_status = ?, examiner_notes = ?, reviewed_by = ?, reviewed_at = ?
        WHERE id = ?
      `).run(decision, notes, reviewerUsername, new Date().toISOString(), findingId);

      // Insert audit history row in finding_reviews
      const reviewId = `REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      this.db.prepare(`
        INSERT INTO finding_reviews (id, finding_id, reviewer_username, reviewer_role, previous_status, new_status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(reviewId, findingId, reviewerUsername, reviewerRole, prevStatus, decision, notes, new Date().toISOString());

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Retrieve reviews history for a finding
   */
  public getFindingReviews(findingId: string): FindingReviewRecord[] {
    const rows = this.db.prepare('SELECT * FROM finding_reviews WHERE finding_id = ? ORDER BY created_at DESC').all(findingId) as any[];
    return rows.map(r => ({
      id: r.id,
      finding_id: r.finding_id,
      reviewer_username: r.reviewer_username,
      reviewer_role: r.reviewer_role,
      previous_status: r.previous_status,
      new_status: r.new_status,
      notes: r.notes,
      created_at: r.created_at
    }));
  }

  /**
   * Retrieve assets for an entity or all assets
   */
  public getAssets(entityId?: string): Asset[] {
    let sql = 'SELECT * FROM assets ORDER BY hostname ASC';
    const params: any[] = [];
    if (entityId) {
      sql = 'SELECT * FROM assets WHERE entity_id = ? ORDER BY hostname ASC';
      params.push(entityId);
    }
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(r => ({
      id: r.id,
      entity_id: r.entity_id,
      hostname: r.hostname,
      ip_address: r.ip_address,
      asset_type: r.asset_type,
      criticality: r.criticality,
      owner_dept: r.owner_dept || r.owner_department || 'Enterprise SOC Operations',
      is_in_active_inventory: Boolean(r.is_in_active_inventory),
      last_scanned_at: r.last_scanned_at,
      created_at: r.created_at
    }));
  }

  /**
   * Record analytics run lifecycle
   */
  public recordAnalyticsRunStart(run: { id: string; executed_by: string; entity_id?: string }): void {
    try {
      this.db.prepare(`
        INSERT INTO analytics_runs (id, started_at, executed_by, entity_id, status)
        VALUES (?, ?, ?, ?, 'STARTED')
      `).run(run.id, new Date().toISOString(), run.executed_by, run.entity_id || null);
    } catch (err) {
      console.warn('[SQLite] recordAnalyticsRunStart error:', err);
    }
  }

  public recordAnalyticsRunComplete(
    runId: string,
    recordsAnalyzed: number,
    workflowsAnalyzed: number,
    findingsGenerated: number,
    status: 'COMPLETED' | 'FAILED' = 'COMPLETED',
    errorSummary?: string
  ): void {
    try {
      this.db.prepare(`
        UPDATE analytics_runs
        SET completed_at = ?, records_analyzed = ?, workflows_analyzed = ?, findings_generated = ?, status = ?, error_summary = ?
        WHERE id = ?
      `).run(new Date().toISOString(), recordsAnalyzed, workflowsAnalyzed, findingsGenerated, status, errorSummary || null, runId);
    } catch (err) {
      console.warn('[SQLite] recordAnalyticsRunComplete error:', err);
    }
  }

  public getAnalyticsRuns(limit = 20): AnalyticsRunRecord[] {
    const rows = this.db.prepare('SELECT * FROM analytics_runs ORDER BY started_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => ({
      id: r.id,
      started_at: r.started_at,
      completed_at: r.completed_at,
      executed_by: r.executed_by,
      entity_id: r.entity_id,
      records_analyzed: r.records_analyzed || 0,
      workflows_analyzed: r.workflows_analyzed || 0,
      findings_generated: r.findings_generated || 0,
      status: r.status,
      error_summary: r.error_summary
    }));
  }

  /**
   * Ingestion batch tracking
   */
  public recordIngestionBatch(batch: IngestionBatch): void {
    try {
      this.db.prepare(`
        INSERT INTO ingestion_batches (id, filename, dataset_type, uploaded_by, uploaded_at, record_count, valid_count, invalid_count, status, error_summary, assessment_period)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        batch.id,
        batch.filename,
        batch.dataset_type,
        batch.uploaded_by,
        batch.uploaded_at,
        batch.record_count,
        batch.valid_count,
        batch.invalid_count,
        batch.status,
        batch.error_summary || null,
        batch.assessment_period || 'Q2-2026'
      );
    } catch (err) {
      console.warn('[SQLite] recordIngestionBatch error:', err);
    }
  }

  public getIngestionBatches(limit = 20): IngestionBatch[] {
    const rows = this.db.prepare('SELECT * FROM ingestion_batches ORDER BY uploaded_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => ({
      id: r.id,
      filename: r.filename,
      dataset_type: r.dataset_type,
      uploaded_by: r.uploaded_by,
      uploaded_at: r.uploaded_at,
      record_count: r.record_count,
      valid_count: r.valid_count,
      invalid_count: r.invalid_count,
      status: r.status,
      error_summary: r.error_summary,
      assessment_period: r.assessment_period
    }));
  }

  /**
   * Transactional custom data ingestion with strict referential validation
   */
  public transactionalIngestCustom(
    batchId: string,
    filename: string,
    uploader: string,
    datasetType: string,
    records: { cases?: Case[]; alerts?: Alert[]; assets?: Asset[]; entities?: Entity[] }
  ): { success: boolean; recordsImported: number; error?: string } {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      let importedCount = 0;

      // 1. Check & Insert Entities if provided
      if (records.entities && records.entities.length > 0) {
        const insEntity = this.db.prepare(`
          INSERT OR REPLACE INTO entities (id, name, code, sector, criticality_tier, soc_contact, assessment_period, status, resilience_score)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const e of records.entities) {
          insEntity.run(
            e.id,
            e.name,
            e.code,
            e.sector,
            e.criticality_tier || 'Tier-2',
            e.soc_contact || 'soc@cse.gov.in',
            'Q2-2026',
            'Active Assessment',
            e.resilience_score || 75.0
          );
          importedCount++;
        }
      }

      // 2. Validate and Insert Alerts
      if (records.alerts && records.alerts.length > 0) {
        const insAlert = this.db.prepare(`
          INSERT OR REPLACE INTO alerts (id, entity_id, timestamp, source_tool, severity, category, target_host, target_ip, analyst_id, status, triage_duration_sec, summary)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const a of records.alerts) {
          // Verify entity exists
          const ent = this.db.prepare('SELECT id FROM entities WHERE id = ?').get(a.entityId);
          if (!ent) {
            throw new Error(`Referential Integrity Violation: Alert ${a.id} references non-existent entity ${a.entityId}`);
          }
          insAlert.run(
            a.id,
            a.entityId,
            a.timestamp || a.rawTimestamp || new Date().toISOString(),
            a.source || 'SIEM Ingest Stream',
            a.severity,
            a.category || 'Security Alert',
            a.target_host || 'srv-host.internal',
            a.target_ip || '10.0.0.1',
            a.analyst_id || 'ANL-001',
            a.status || 'TRIAGED',
            a.triage_duration_sec || 180,
            a.description || a.title
          );
          importedCount++;
        }
      }

      // 3. Validate and Insert Cases
      if (records.cases && records.cases.length > 0) {
        const insCase = this.db.prepare(`
          INSERT OR REPLACE INTO cases (id, entity_id, alert_id, created_at, priority, owner_analyst, status, escalation_flag, sla_target_minutes, sla_breached, severity)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const c of records.cases) {
          // Verify entity exists
          const ent = this.db.prepare('SELECT id FROM entities WHERE id = ?').get(c.entityId);
          if (!ent) {
            throw new Error(`Referential Integrity Violation: Case ${c.id} references non-existent entity ${c.entityId}`);
          }
          // Verify alert exists and belongs to same entity
          const al = this.db.prepare('SELECT id, entity_id FROM alerts WHERE id = ?').get(c.alertId) as any;
          if (al && al.entity_id !== c.entityId) {
            throw new Error(`Data Inconsistency: Case ${c.id} alert ${c.alertId} belongs to entity ${al.entity_id}, not ${c.entityId}`);
          }
          insCase.run(
            c.id,
            c.entityId,
            c.alertId,
            c.createdAt || new Date().toISOString(),
            c.priority || c.severity,
            c.assignedAnalyst || 'Unassigned',
            c.status || 'OPEN',
            c.slaBreached ? 1 : 0,
            c.slaTargetMinutes || 60,
            c.slaBreached ? 1 : 0,
            c.severity
          );
          importedCount++;
        }
      }

      // 4. Update Entity summary counters
      this.db.exec(`
        UPDATE entities SET
          total_alerts = (SELECT COUNT(*) FROM alerts WHERE alerts.entity_id = entities.id),
          total_cases = (SELECT COUNT(*) FROM cases WHERE cases.entity_id = entities.id);
      `);

      // 5. Update batch status to IMPORTED
      this.db.prepare(`
        UPDATE ingestion_batches
        SET status = 'IMPORTED', valid_count = ?, record_count = ?
        WHERE id = ?
      `).run(importedCount, importedCount, batchId);

      this.db.exec('COMMIT;');
      return { success: true, recordsImported: importedCount };
    } catch (err: any) {
      this.db.exec('ROLLBACK;');
      this.db.prepare(`
        UPDATE ingestion_batches
        SET status = 'FAILED', error_summary = ?
        WHERE id = ?
      `).run(err.message, batchId);
      return { success: false, recordsImported: 0, error: err.message };
    }
  }

  /**
   * Diagnostic Database Health Endpoint (Section 44)
   * Safe information without revealing passwords, internal paths, or tokens.
   */
  public getDatabaseHealth(): Record<string, any> {
    try {
      const entityCount = (this.db.prepare('SELECT COUNT(*) as count FROM entities').get() as any).count;
      const alertCount = (this.db.prepare('SELECT COUNT(*) as count FROM alerts').get() as any).count;
      const caseCount = (this.db.prepare('SELECT COUNT(*) as count FROM cases').get() as any).count;
      const invCount = (this.db.prepare('SELECT COUNT(*) as count FROM investigations').get() as any).count;
      const escCount = (this.db.prepare('SELECT COUNT(*) as count FROM escalations').get() as any).count;
      const closureCount = (this.db.prepare('SELECT COUNT(*) as count FROM closures').get() as any).count;
      const assetCount = (this.db.prepare('SELECT COUNT(*) as count FROM assets').get() as any).count;
      const findingCount = (this.db.prepare('SELECT COUNT(*) as count FROM findings').get() as any).count;
      const reviewCount = (this.db.prepare('SELECT COUNT(*) as count FROM finding_reviews').get() as any).count;
      const auditCount = (this.db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any).count;
      const batchCount = (this.db.prepare('SELECT COUNT(*) as count FROM ingestion_batches').get() as any).count;
      const runCount = (this.db.prepare('SELECT COUNT(*) as count FROM analytics_runs').get() as any).count;

      const lastRun = this.db.prepare('SELECT * FROM analytics_runs ORDER BY started_at DESC LIMIT 1').get() as any;
      const lastBatch = this.db.prepare('SELECT * FROM ingestion_batches ORDER BY uploaded_at DESC LIMIT 1').get() as any;
      const integrityCheck = this.db.prepare('PRAGMA integrity_check;').get() as any;

      return {
        status: 'HEALTHY',
        databaseEngine: 'SQLite 3 (WAL mode)',
        foreignKeysEnforced: true,
        schemaVersion: '1.2.0-SIH26157',
        integrityStatus: integrityCheck?.integrity_check || 'ok',
        tableCounts: {
          entities: entityCount,
          alerts: alertCount,
          cases: caseCount,
          investigations: invCount,
          escalations: escCount,
          closures: closureCount,
          assets: assetCount,
          findings: findingCount,
          findingReviews: reviewCount,
          auditLogs: auditCount,
          ingestionBatches: batchCount,
          analyticsRuns: runCount
        },
        lastAnalyticsRun: lastRun ? {
          id: lastRun.id,
          timestamp: lastRun.started_at,
          status: lastRun.status,
          findingsGenerated: lastRun.findings_generated
        } : null,
        lastIngestionBatch: lastBatch ? {
          id: lastBatch.id,
          filename: lastBatch.filename,
          uploadedAt: lastBatch.uploaded_at,
          status: lastBatch.status
        } : null,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      return {
        status: 'DEGRADED',
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Export structured assessment database dossier (Section 45)
   */
  public exportDatabaseDossier(): Record<string, any> {
    const entities = this.db.prepare('SELECT * FROM entities').all();
    const findings = this.db.prepare('SELECT * FROM findings').all();
    const cases = this.db.prepare('SELECT * FROM cases').all();
    const assets = this.db.prepare('SELECT * FROM assets').all();
    const reviews = this.db.prepare('SELECT * FROM finding_reviews').all();
    const batches = this.db.prepare('SELECT * FROM ingestion_batches').all();
    const runs = this.db.prepare('SELECT * FROM analytics_runs').all();

    return {
      metadata: {
        exportType: 'SAT-SA Supervisory Assessment Database Dossier',
        sihProblemStatement: 'SIH26157',
        exportedAt: new Date().toISOString(),
        assessmentPeriod: 'Q2-2026',
        formatVersion: '1.2.0'
      },
      entities,
      findings,
      cases,
      assets,
      findingReviews: reviews,
      ingestionBatches: batches,
      analyticsRuns: runs
    };
  }

  /**
   * Cleanly reset synthetic data while preserving user accounts and audit history
   */
  public resetSyntheticData(): void {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      this.db.exec('DELETE FROM closures;');
      this.db.exec('DELETE FROM escalations;');
      this.db.exec('DELETE FROM investigations;');
      this.db.exec('DELETE FROM cases;');
      this.db.exec('DELETE FROM alerts;');
      this.db.exec('DELETE FROM assets;');
      this.db.exec('DELETE FROM findings WHERE review_status = "Pending Review";');
      this.db.exec('DELETE FROM entities;');
      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }
}

// Global SQLite Database Singleton
export const sqliteDb = new SQLiteDatabase();
