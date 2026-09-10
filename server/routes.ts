import { Router, Request, Response } from 'express';
import { db } from './db';
import { dbBackend } from './dbBackend';
import {
  verifyPassword,
  signToken,
  extractAuthUser,
  authenticate,
  requireRole,
  requirePermission,
  PRESET_USERS,
  createPasswordResetRequest,
  verifyPasswordResetCode,
  completePasswordReset
} from './auth';
import { validateAndNormalizeSOCData } from './engine/normalizer';
import { generateAssessmentDossier } from './engine/reporting';
import { SCENARIO_DEFINITIONS } from './engine/scenarios';
import { PERMISSIONS, UserRole } from './types';

export const apiRouter = Router();

// ----------------------------------------------------
// AUTHENTICATION & USERS
// ----------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, email, password } = req.body || {};
  const identifier = String(username || email || '').trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  const user = db.users.find(u =>
    u.username.toLowerCase() === identifier ||
    u.email.toLowerCase() === identifier
  );

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    db.addAuditLog({
      actorEmail: identifier,
      actorName: 'Unauthenticated User',
      actorRole: 'Auditor',
      action: 'LOGIN_FAILURE',
      targetType: 'AUTH',
      targetId: 'FAILED',
      metadata: { ip: req.ip, identifier, reason: 'Invalid credentials or inactive user' }
    });
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  user.lastLogin = new Date().toISOString();

  const token = signToken({
    userId: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    accessLevel: user.accessLevel,
    permissions: user.permissions
  });

  db.addAuditLog({
    actorEmail: user.email,
    actorName: user.name,
    actorRole: user.role,
    action: 'LOGIN_SUCCESS',
    targetType: 'AUTH',
    targetId: user.id,
    metadata: {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      accessLevel: user.accessLevel,
      role: user.role
    }
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      accessLevel: user.accessLevel,
      organization: user.organization,
      permissions: user.permissions,
      assignedEntities: user.assignedEntities
    }
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authUser = extractAuthUser(req);
  if (authUser) {
    db.addAuditLog({
      actorEmail: authUser.email,
      actorName: authUser.name,
      actorRole: authUser.role,
      action: 'LOGOUT',
      targetType: 'AUTH',
      targetId: authUser.userId,
      metadata: { ip: req.ip }
    });
  }
  res.json({ success: true, message: 'Session logged out successfully' });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { identifier } = req.body || {};
  if (!identifier || !String(identifier).trim()) {
    return res.status(400).json({ error: 'Username or official email address is required' });
  }

  const result = createPasswordResetRequest(String(identifier).trim(), req.ip);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    message: 'Supervisory verification challenge generated.',
    ...result.challenge
  });
});

apiRouter.post('/auth/verify-reset-code', (req: Request, res: Response) => {
  const { resetToken, code } = req.body || {};
  if (!resetToken || !code) {
    return res.status(400).json({ error: 'Reset token and 6-digit verification code are required' });
  }

  const result = verifyPasswordResetCode(String(resetToken), String(code), req.ip);
  if (!result.success) {
    return res.status(400).json({ error: result.error, attemptsLeft: result.attemptsLeft });
  }

  res.json({
    success: true,
    message: 'Identity verified. You may now specify a new compliant password.'
  });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { resetToken, newPassword, confirmPassword } = req.body || {};
  if (!resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Reset token, new password, and confirmation password are required' });
  }

  const result = completePasswordReset(String(resetToken), String(newPassword), String(confirmPassword), req.ip);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    message: 'Password credentials updated successfully. You may now sign in with your new password.',
    updatedUsername: result.username
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const authUser = extractAuthUser(req);
  if (!authUser) {
    return res.status(401).json({
      authenticated: false,
      error: 'Authentication required. No valid active session.'
    });
  }

  const user = db.users.find(u => u.id === authUser.userId);
  if (!user || !user.active) {
    return res.status(401).json({
      authenticated: false,
      error: 'User account not found or deactivated.'
    });
  }

  res.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      accessLevel: user.accessLevel,
      organization: user.organization,
      permissions: user.permissions,
      assignedEntities: user.assignedEntities
    }
  });
});

apiRouter.get('/auth/users', authenticate, (req: Request, res: Response) => {
  res.json({
    users: db.users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      role: u.role,
      accessLevel: u.accessLevel,
      organization: u.organization,
      permissions: u.permissions
    }))
  });
});

// ----------------------------------------------------
// ANALYTICS & KPIS
// ----------------------------------------------------
apiRouter.get('/analytics/summary', (req: Request, res: Response) => {
  res.json(db.getKPISummary());
});

apiRouter.get('/analytics/findings-by-severity', (req: Request, res: Response) => {
  const counts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  for (const f of db.findings) {
    counts[f.severity] = (counts[f.severity] || 0) + 1;
  }

  const data = [
    { severity: 'Critical', count: counts.CRITICAL, fill: '#dc2626' },
    { severity: 'High', count: counts.HIGH, fill: '#ea580c' },
    { severity: 'Medium', count: counts.MEDIUM, fill: '#eab308' },
    { severity: 'Low', count: counts.LOW, fill: '#3b82f6' }
  ];

  res.json(data);
});

apiRouter.get('/analytics/findings-by-category', (req: Request, res: Response) => {
  const counts: Record<string, number> = {};
  for (const f of db.findings) {
    counts[f.category] = (counts[f.category] || 0) + 1;
  }

  const data = Object.entries(counts).map(([category, count]) => ({
    category,
    count
  })).sort((a, b) => b.count - a.count);

  res.json(data);
});

apiRouter.get('/analytics/workflow-completion', (req: Request, res: Response) => {
  const stats = db.getStatistics();
  res.json(stats.conversionFunnel);
});

apiRouter.get('/analytics/trends', (req: Request, res: Response) => {
  const stats = db.getStatistics();
  res.json(stats.trends);
});

apiRouter.get('/analytics/entity-priority', (req: Request, res: Response) => {
  const stats = db.getStatistics();
  res.json(stats.entityRankings);
});

apiRouter.get('/analytics/negative-space-matrix', (req: Request, res: Response) => {
  res.json(db.getNegativeSpaceMatrix());
});

apiRouter.get('/analytics/full-statistics', (req: Request, res: Response) => {
  res.json(db.getStatistics());
});

apiRouter.get('/analytics/ml-anomalies', (req: Request, res: Response) => {
  const mlFindings = db.findings.filter(f => f.mlAnomalySignal?.isAnomaly);
  res.json(mlFindings.map(f => ({
    findingId: f.id,
    caseNumber: f.caseNumber,
    entityName: f.entityName,
    title: f.title,
    severity: f.severity,
    anomalyScore: f.mlAnomalySignal?.anomalyScore,
    featureContributions: f.mlAnomalySignal?.featureContributions
  })));
});

// ----------------------------------------------------
// FINDINGS & DETAILS
// ----------------------------------------------------
apiRouter.get('/findings', (req: Request, res: Response) => {
  let list = [...db.findings];

  const { severity, priority, category, entity, status, search, sort } = req.query;

  if (severity && severity !== 'ALL') {
    list = list.filter(f => f.severity.toUpperCase() === String(severity).toUpperCase());
  }
  if (priority && priority !== 'ALL') {
    list = list.filter(f => f.priorityLevel.toUpperCase() === String(priority).toUpperCase());
  }
  if (category && category !== 'ALL') {
    list = list.filter(f => f.category.toLowerCase() === String(category).toLowerCase());
  }
  if (entity && entity !== 'ALL') {
    list = list.filter(f => f.entityId === entity || f.entityName.toLowerCase().includes(String(entity).toLowerCase()));
  }
  if (status && status !== 'ALL') {
    list = list.filter(f => f.reviewStatus.toUpperCase() === String(status).toUpperCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      f =>
        f.id.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.caseNumber.toLowerCase().includes(q) ||
        f.entityName.toLowerCase().includes(q) ||
        f.whatHappened.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'severity') {
    const sevWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    list.sort((a, b) => sevWeight[b.severity] - sevWeight[a.severity]);
  } else if (sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // Default: priority
    list.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  res.json({
    total: list.length,
    findings: list
  });
});

apiRouter.get('/findings/:id', (req: Request, res: Response) => {
  const finding = db.findings.find(f => f.id === req.params.id);
  if (!finding) {
    return res.status(404).json({ error: `Finding ${req.params.id} not found` });
  }

  // Audit view
  const authUser = extractAuthUser(req);
  db.addAuditLog({
    actorEmail: authUser?.email || 'examiner@satsa.gov.in',
    actorName: authUser?.name || 'Dr. Arunima Sen',
    actorRole: authUser?.role || 'Lead Examiner',
    action: 'FINDING_VIEWED',
    targetType: 'FINDING',
    targetId: finding.id,
    metadata: { title: finding.title }
  });

  res.json(finding);
});

// ----------------------------------------------------
// ADVANCED SUPERVISORY EXAMINER DECISION SUPPORT ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/correlations', (req: Request, res: Response) => {
  res.json(db.getCorrelations());
});

apiRouter.get('/sampling', (req: Request, res: Response) => {
  const size = parseInt(req.query.size as string) || 20;
  res.json(db.getSmartSample(size));
});

apiRouter.post('/sampling/replace', (req: Request, res: Response) => {
  const { caseIdToReplace, newCandidateId } = req.body || {};
  if (!caseIdToReplace) {
    return res.status(400).json({ error: 'caseIdToReplace is required' });
  }
  const sample = db.replaceSampleCandidate(caseIdToReplace, newCandidateId);
  res.json(sample);
});

apiRouter.get('/fingerprints', (req: Request, res: Response) => {
  res.json(db.getFingerprints());
});

apiRouter.get('/timeline', (req: Request, res: Response) => {
  res.json(db.getTimeline());
});

apiRouter.get('/feedback/stats', (req: Request, res: Response) => {
  res.json(db.getFeedbackStats());
});

apiRouter.post('/assistant/query', (req: Request, res: Response) => {
  const { query, contextEntityId, contextCaseId } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query string is required' });
  }

  const response = db.askAssistant(query, contextEntityId, contextCaseId);
  res.json(response);
});

apiRouter.post('/findings/:id/review', authenticate, requireRole('Lead Examiner', 'SOC Supervisor'), (req: Request, res: Response) => {
  const { decision, notes, recommendedFollowUp } = req.body || {};
  const validDecisions = ['CONFIRMED', 'REJECTED', 'NEEDS_EVIDENCE', 'VALID', 'FALSE_POSITIVE', 'NEEDS_INVESTIGATION', 'ACCEPTED_EXCEPTION', 'CONFIRMED_GAP', 'ACKNOWLEDGED'];
  if (!decision || !validDecisions.includes(decision)) {
    return res.status(400).json({ error: `Valid decision is required (${validDecisions.join(', ')})` });
  }

  const authUser = req.user!;

  // SOC Supervisor is limited to acknowledgment, explanations, or requesting evidence; Lead Examiner has full confirmation authority
  if (authUser.role === 'SOC Supervisor' && (decision === 'CONFIRMED' || decision === 'CONFIRMED_GAP' || decision === 'REJECTED')) {
    return res.status(403).json({
      error: 'SOC Supervisors can acknowledge findings or provide operational explanations, but final supervisory gap confirmation or rejection is reserved for Lead Examiner.',
      code: 'EXAMINER_AUTHORITY_REQUIRED'
    });
  }

  const reviewer = {
    id: authUser.userId,
    name: authUser.name,
    email: authUser.email,
    role: authUser.role
  };

  const updated = db.reviewFinding(req.params.id, decision as any, reviewer, notes || 'Review decision submitted.', recommendedFollowUp);
  if (!updated) {
    return res.status(404).json({ error: `Finding ${req.params.id} not found` });
  }

  db.addAuditLog({
    actorEmail: authUser.email,
    actorName: authUser.name,
    actorRole: authUser.role,
    action: authUser.role === 'Lead Examiner' ? 'FINDING_CONFIRMED' : 'FINDING_ACKNOWLEDGED',
    targetType: 'FINDING',
    targetId: updated.id,
    metadata: { decision, notes, caseNumber: updated.caseNumber }
  });

  res.json({
    success: true,
    message: `Finding ${req.params.id} recorded as ${decision}`,
    finding: updated
  });
});

apiRouter.get('/findings/:id/reviews', authenticate, async (req: Request, res: Response) => {
  const reviews = await dbBackend.getFindingReviews(req.params.id);
  res.json({
    findingId: req.params.id,
    totalReviews: reviews.length,
    reviews
  });
});

// ----------------------------------------------------
// ENTITIES & ASSETS
// ----------------------------------------------------
apiRouter.get('/entities', (req: Request, res: Response) => {
  res.json(db.entities);
});

apiRouter.get('/entities/:id/alerts', (req: Request, res: Response) => {
  const alerts = db.alerts.filter(a => a.entityId === req.params.id);
  res.json({ entityId: req.params.id, total: alerts.length, alerts });
});

apiRouter.get('/entities/:id/cases', (req: Request, res: Response) => {
  const cases = db.cases.filter(c => c.entityId === req.params.id);
  res.json({ entityId: req.params.id, total: cases.length, cases });
});

apiRouter.get('/entities/:id/assets', async (req: Request, res: Response) => {
  const assets = await dbBackend.getAssets(req.params.id);
  res.json({ entityId: req.params.id, total: assets.length, assets });
});

// ----------------------------------------------------
// CASES & RECONSTRUCTED WORKFLOWS
// ----------------------------------------------------
apiRouter.get('/cases/:id', (req: Request, res: Response) => {
  const c = db.cases.find(item => item.id === req.params.id || item.caseNumber === req.params.id);
  if (!c) {
    return res.status(404).json({ error: `Case ${req.params.id} not found` });
  }
  res.json(c);
});

apiRouter.get('/cases/:id/workflow', (req: Request, res: Response) => {
  const c = db.cases.find(item => item.id === req.params.id || item.caseNumber === req.params.id);
  if (!c) {
    return res.status(404).json({ error: `Case ${req.params.id} not found` });
  }
  const matchingAlert = db.alerts.find(a => a.id === c.alertId);
  const matchingInv = db.investigations.find(i => i.caseId === c.id);
  const matchingEsc = db.escalations.find(e => e.caseId === c.id);
  const matchingClosure = db.closures.find(cl => cl.caseId === c.id);
  const matchingEvidence = db.evidences.filter(ev => ev.caseId === c.id);
  const matchingFindings = db.findings.filter(f => f.caseId === c.id);

  res.json({
    case: c,
    alert: matchingAlert || null,
    investigation: matchingInv || null,
    escalation: matchingEsc || null,
    closure: matchingClosure || null,
    evidence: matchingEvidence,
    supervisoryFindings: matchingFindings
  });
});

apiRouter.get('/cases/:id/evidence', (req: Request, res: Response) => {
  const evidence = db.evidences.filter(e => e.caseId === req.params.id);
  res.json({ caseId: req.params.id, total: evidence.length, evidence });
});

// ----------------------------------------------------
// SCENARIOS & DEMO MODE
// ----------------------------------------------------
apiRouter.get('/scenarios', (req: Request, res: Response) => {
  res.json({
    activeScenarioId: db.activeScenarioId,
    scenarios: SCENARIO_DEFINITIONS
  });
});

apiRouter.post('/scenarios/load', authenticate, requireRole('Lead Examiner'), (req: Request, res: Response) => {
  const { scenarioId } = req.body || {};
  if (!scenarioId) {
    return res.status(400).json({ error: 'scenarioId is required' });
  }

  const authUser = req.user!;
  db.loadScenario(scenarioId, authUser.name);

  db.addAuditLog({
    actorEmail: authUser.email,
    actorName: authUser.name,
    actorRole: authUser.role,
    action: 'SCENARIO_LOADED',
    targetType: 'SYSTEM_STATE',
    targetId: scenarioId,
    metadata: { scenarioId }
  });

  res.json({
    success: true,
    activeScenarioId: db.activeScenarioId,
    kpi: db.getKPISummary(),
    findingsCount: db.findings.length
  });
});

// ----------------------------------------------------
// DATA INGESTION (CSV / JSON / SQL DB DUMPS / REST API)
// ----------------------------------------------------
const handleIngestion = async (req: Request, res: Response) => {
  const { content, mimeType = 'text/csv', records, filename = 'soc_dataset.csv', autoRunAnalytics = true } = req.body || {};
  let payloadContent = content;

  // If directly posted JSON records via REST API
  if (!payloadContent && records && Array.isArray(records)) {
    payloadContent = JSON.stringify(records);
  }

  if (!payloadContent) {
    return res.status(400).json({ error: 'Uploaded content payload or records array is required' });
  }

  const authUser = req.user!;
  const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // 1. Structural Validation
  const result = validateAndNormalizeSOCData(payloadContent, mimeType);

  if (!result.success && result.errors.length > 0 && result.normalizedCases.length === 0) {
    await dbBackend.recordIngestionBatch({
      id: batchId,
      filename,
      dataset_type: mimeType.includes('json') ? 'JSON' : 'CSV',
      uploaded_by: authUser.email,
      uploaded_at: new Date().toISOString(),
      record_count: 0,
      valid_count: 0,
      invalid_count: result.errors.length,
      status: 'FAILED',
      error_summary: result.errors.join('; '),
      assessment_period: 'Q2-2026'
    });
    return res.status(422).json({
      error: 'Data validation and normalization failed',
      errors: result.errors
    });
  }

  // 2. Register Ingestion Batch
  await dbBackend.recordIngestionBatch({
    id: batchId,
    filename,
    dataset_type: mimeType.includes('json') ? 'JSON' : 'CSV',
    uploaded_by: authUser.email,
    uploaded_at: new Date().toISOString(),
    record_count: result.normalizedCases.length + result.normalizedAlerts.length,
    valid_count: result.normalizedCases.length + result.normalizedAlerts.length,
    invalid_count: result.errors.length,
    status: 'VALIDATING',
    assessment_period: 'Q2-2026'
  });

  // 3. Transactional Ingest into Database
  const txResult = await dbBackend.transactionalIngestCustom(
    batchId,
    filename,
    authUser.email,
    'SOC_INCIDENTS',
    { cases: result.normalizedCases as any, alerts: result.normalizedAlerts as any }
  );

  if (!txResult.success) {
    return res.status(400).json({
      error: 'Transactional ingestion failed',
      details: txResult.error
    });
  }

  // 4. Synchronize in-memory engine and recalculate analytics
  db.ingestCustomDataset(result.normalizedCases, result.normalizedAlerts, authUser.email);
  if (autoRunAnalytics) {
    db.recomputeAnalytics({ executedBy: authUser.name });
  }

  db.addAuditLog({
    actorEmail: authUser.email,
    actorName: authUser.name,
    actorRole: authUser.role,
    action: 'DATA_INGESTED',
    targetType: 'DATASET',
    targetId: batchId,
    metadata: {
      batchId,
      filename,
      casesCount: result.normalizedCases.length,
      alertsCount: result.normalizedAlerts.length,
      mimeType
    }
  });

  res.json({
    success: true,
    batchId,
    recordsImported: txResult.recordsImported,
    ingestion: result,
    newSummary: db.getKPISummary()
  });
};

apiRouter.post('/upload', authenticate, requireRole('Lead Examiner', 'SOC Supervisor'), handleIngestion);
apiRouter.post('/ingest', authenticate, requireRole('Lead Examiner', 'SOC Supervisor'), handleIngestion);
apiRouter.post('/ingest/import', authenticate, requireRole('Lead Examiner', 'SOC Supervisor'), handleIngestion);

apiRouter.post('/ingest/validate-csv', authenticate, (req: Request, res: Response) => {
  const { content, mimeType = 'text/csv' } = req.body || {};
  if (!content) {
    return res.status(400).json({ error: 'Uploaded content is required for structural validation' });
  }
  const result = validateAndNormalizeSOCData(content, mimeType);
  res.json(result);
});

apiRouter.get('/ingest/batches', authenticate, async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const batches = await dbBackend.getIngestionBatches(limit);
  res.json({
    total: batches.length,
    batches
  });
});

apiRouter.get('/ingest/batches/:id', authenticate, async (req: Request, res: Response) => {
  const batches = await dbBackend.getIngestionBatches(100);
  const found = batches.find(b => b.id === req.params.id);
  if (!found) {
    return res.status(404).json({ error: `Ingestion batch ${req.params.id} not found` });
  }
  res.json(found);
});

apiRouter.post('/ingest/reset-synthetic', authenticate, requireRole('Lead Examiner'), async (req: Request, res: Response) => {
  const authUser = req.user!;
  await dbBackend.resetSyntheticData();
  db.loadScenario('SCENARIO_1', authUser.name);

  db.addAuditLog({
    actorEmail: authUser.email,
    actorName: authUser.name,
    actorRole: authUser.role,
    action: 'SCENARIO_LOADED',
    targetType: 'SYSTEM_STATE',
    targetId: 'BASELINE_SCENARIO_1',
    metadata: { reason: 'Lead Examiner initiated synthetic baseline reset' }
  });

  res.json({
    success: true,
    message: 'Assessment database cleanly reset to baseline Scenario 1. User credentials and audit trails preserved.',
    kpi: db.getKPISummary()
  });
});

// ----------------------------------------------------
// ANALYTICS RUNS & TRACKING
// ----------------------------------------------------
apiRouter.post('/analytics/run', authenticate, requireRole('Lead Examiner', 'SOC Supervisor'), (req: Request, res: Response) => {
  const authUser = req.user!;
  const entityId = req.body?.entityId;

  db.recomputeAnalytics({ executedBy: authUser.name, entityId });

  db.addAuditLog({
    actorEmail: authUser.email,
    actorName: authUser.name,
    actorRole: authUser.role,
    action: 'ANALYTICS_EXECUTED',
    targetType: 'ENGINE',
    targetId: 'SUPERVISORY_RUN',
    metadata: { findingsCount: db.findings.length, entityId }
  });

  res.json({
    success: true,
    message: 'Supervisory analytics engine executed successfully. SQLite persistence synchronized.',
    totalFindings: db.findings.length,
    criticalFindings: db.findings.filter(f => f.severity === 'CRITICAL').length,
    kpi: db.getKPISummary()
  });
});

apiRouter.get('/analytics/runs', authenticate, async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const runs = await dbBackend.getAnalyticsRuns(limit);
  res.json({
    total: runs.length,
    runs
  });
});

// ----------------------------------------------------
// SYSTEM DIAGNOSTICS & EXPORT
// ----------------------------------------------------
apiRouter.get('/system/database-health', async (req: Request, res: Response) => {
  const health = await dbBackend.getDatabaseHealth();
  res.json(health);
});

apiRouter.get('/system/export', authenticate, requireRole('Lead Examiner', 'Auditor'), async (req: Request, res: Response) => {
  const authUser = req.user!;
  const dossier = await dbBackend.exportDatabaseDossier();

  db.addAuditLog({
    actorEmail: authUser.email,
    actorName: authUser.name,
    actorRole: authUser.role,
    action: 'REPORT_GENERATED',
    targetType: 'SYSTEM_STATE',
    targetId: 'DOSSIER_EXPORT',
    metadata: { tables: Object.keys(dossier) }
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="satsa_assessment_database_${Date.now()}.json"`);
  res.json(dossier);
});

// ----------------------------------------------------
// AUDIT LOGS (Authoritative SQLite Store)
// ----------------------------------------------------
apiRouter.get('/audit/logs', authenticate, async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const user = req.user!;
  const logs = await dbBackend.getAuditLogs(user.role, limit);

  res.json({
    total: logs.length,
    events: logs
  });
});

// Audit records are strictly immutable
apiRouter.delete('/audit/logs', authenticate, (req: Request, res: Response) => {
  db.addAuditLog({
    actorEmail: req.user?.email || 'unknown',
    actorName: req.user?.name || 'unknown',
    actorRole: req.user?.role || 'Auditor',
    action: 'ACCESS_DENIED',
    targetType: 'AUDIT_LOG_IMMUTABILITY',
    targetId: 'DELETE_ATTEMPT',
    metadata: { reason: 'Audit log deletion prohibited by statutory policy' }
  });
  return res.status(403).json({
    error: 'Statutory compliance violation: Audit trail records are cryptographically immutable and cannot be deleted.',
    code: 'AUDIT_LOG_IMMUTABLE'
  });
});

// ----------------------------------------------------
// ASSESSMENT REPORT / DOSSIER
// ----------------------------------------------------
apiRouter.get('/reports/assessment-dossier', (req: Request, res: Response) => {
  const authUser = extractAuthUser(req);
  const examinerName = authUser ? `${authUser.name} (${authUser.role})` : 'Dr. Arunima Sen (Lead Examiner)';
  const dossier = generateAssessmentDossier(examinerName);

  db.addAuditLog({
    actorEmail: authUser?.email || 'examiner@satsa.gov.in',
    actorName: authUser?.name || 'Dr. Arunima Sen',
    actorRole: authUser?.role || 'Lead Examiner',
    action: 'REPORT_GENERATED',
    targetType: 'REPORT',
    targetId: dossier.metadata.reportId,
    metadata: { totalFindings: dossier.findingsDossier.length }
  });

  res.json(dossier);
});

// ----------------------------------------------------
// 25 ENTERPRISE-GRADE ANALYTICS ENGINE API ENDPOINTS
// ----------------------------------------------------

// Feature 1: AI Anomaly Detection Engine (iForest, LOF, DBSCAN, Autoencoder)
apiRouter.get('/analytics/anomalies', (req: Request, res: Response) => {
  res.json({
    total: db.getAIAnomalies().length,
    findings: db.getAIAnomalies()
  });
});

// Feature 2: Peer Benchmarking Engine
apiRouter.get('/analytics/benchmarks', (req: Request, res: Response) => {
  res.json({
    totalEntities: db.getPeerBenchmarks().length,
    benchmarks: db.getPeerBenchmarks()
  });
});

// Feature 3: Smart Sampling Engine & Top 6 Target Lists
apiRouter.get('/analytics/smart-sampling', (req: Request, res: Response) => {
  const sampleSize = parseInt(req.query.sampleSize as string) || 20;
  res.json(db.getSmartSamplingReport(sampleSize));
});

// Feature 4: Offline NLP Investigation Quality Analysis
apiRouter.get('/analytics/nlp-quality', (req: Request, res: Response) => {
  res.json(db.getNLPQualityReport());
});

// Feature 7: Evidence Knowledge Graph
apiRouter.get('/analytics/knowledge-graph', (req: Request, res: Response) => {
  res.json(db.getKnowledgeGraph());
});

// Feature 8: Investigation Timeline Replays
apiRouter.get('/analytics/timeline-replays', (req: Request, res: Response) => {
  res.json({
    total: db.getTimelineReplays().length,
    replays: db.getTimelineReplays()
  });
});

// Feature 9: Root Cause Analysis & Recommendation Tree
apiRouter.get('/analytics/root-cause/:findingId', (req: Request, res: Response) => {
  const findingId = req.params.findingId;
  res.json(db.getRootCauseDiagnosis(findingId));
});

// Feature 10: Explainable AI (SHAP Waterfall)
apiRouter.get('/analytics/shap/:findingId', (req: Request, res: Response) => {
  const findingId = req.params.findingId;
  res.json(db.getSHAPExplanation(findingId));
});

// Feature 11: SOC Health Score Breakdown
apiRouter.get('/analytics/soc-health', (req: Request, res: Response) => {
  res.json(db.getSOCHealthScore());
});

// Feature 12: Governance Maturity Index (GMI)
apiRouter.get('/analytics/governance-maturity', (req: Request, res: Response) => {
  const entityId = req.query.entityId as string | undefined;
  res.json(db.getGovernanceMaturity(entityId));
});

// Feature 13: Cyber Resilience Index (CRI)
apiRouter.get('/analytics/cyber-resilience', (req: Request, res: Response) => {
  const entityId = req.query.entityId as string | undefined;
  res.json(db.getCyberResilience(entityId));
});

// Feature 14: Predictive Forecasts
apiRouter.get('/analytics/predictive-forecasts', (req: Request, res: Response) => {
  res.json({
    forecasts: db.getPredictiveForecasts()
  });
});

// Feature 15: MITRE ATT&CK Matrix Coverage
apiRouter.get('/analytics/mitre-matrix', (req: Request, res: Response) => {
  res.json(db.getMITREMatrix());
});

// Feature 16: Digital Twin SOC Simulator
apiRouter.post('/analytics/digital-twin', (req: Request, res: Response) => {
  const body = req.body || {};
  const simulationInput = {
    staffingDeltaAnalysts: parseInt(body.staffingDeltaAnalysts) || 0,
    escalationComplianceImprovementPct: parseInt(body.escalationComplianceImprovementPct) || 0,
    enableMissingSensors: !!body.enableMissingSensors,
    mttrReductionPct: parseInt(body.mttrReductionPct) || 0,
    detectionRuleTuningPct: parseInt(body.detectionRuleTuningPct) || 0
  };

  const output = db.runDigitalTwin(simulationInput);
  res.json({
    input: simulationInput,
    output
  });
});

// Feature 17: Offline AI Supervisory Copilot
apiRouter.post('/analytics/assistant', (req: Request, res: Response) => {
  const { query } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  const response = db.askOfflineAssistant(query);
  res.json(response);
});

// Feature 20: Data Ingestion Validation Report
apiRouter.get('/analytics/data-validation', (req: Request, res: Response) => {
  res.json(db.getDataValidationReport());
});

// Feature 25: Process Mining Discovery Model
apiRouter.get('/analytics/process-mining', (req: Request, res: Response) => {
  res.json(db.getProcessMining());
});

// Feature 22: Supervisory Alerts & Statutory Policy Gate Engine
apiRouter.get('/analytics/supervisory-alerts', (req: Request, res: Response) => {
  res.json(db.getSupervisoryAlerts());
});

apiRouter.post('/analytics/supervisory-alerts/:id/acknowledge', authenticate, requireRole('Lead Examiner', 'SOC Supervisor'), (req: Request, res: Response) => {
  const success = db.acknowledgeSupervisoryAlert(req.params.id);
  if (!success) {
    return res.status(404).json({ error: `Alert ${req.params.id} not found` });
  }

  db.addAuditLog({
    actorEmail: req.user?.email || 'examiner@satsa.gov.in',
    actorName: req.user?.name || 'Examiner',
    actorRole: req.user?.role || 'Lead Examiner',
    action: 'SUPERVISORY_ALERT_ACKNOWLEDGED',
    targetType: 'ALERT',
    targetId: req.params.id,
    metadata: { alertId: req.params.id }
  });

  res.json({ success: true, message: `Alert ${req.params.id} acknowledged` });
});

apiRouter.post('/analytics/policy-rules/:id/toggle', authenticate, requireRole('Lead Examiner'), (req: Request, res: Response) => {
  const { enabled } = req.body || {};
  const rule = db.togglePolicyRule(req.params.id, enabled);
  if (!rule) {
    return res.status(404).json({ error: `Policy rule ${req.params.id} not found` });
  }

  db.addAuditLog({
    actorEmail: req.user?.email || 'examiner@satsa.gov.in',
    actorName: req.user?.name || 'Dr. Arunima Sen',
    actorRole: req.user?.role || 'Lead Examiner',
    action: 'POLICY_RULE_MODIFIED',
    targetType: 'POLICY_RULE',
    targetId: req.params.id,
    metadata: { ruleName: rule.name, enabled: rule.enabled }
  });

  res.json({ success: true, rule, allRules: db.policyRules });
});

// 25 Enterprise Engines Manifest & Dynamic Controller
apiRouter.get('/analytics/engines', (req: Request, res: Response) => {
  res.json({
    total: 25,
    engines: db.getEnterpriseEnginesSummary()
  });
});

apiRouter.post('/analytics/engines/:id/run', authenticate, requireRole('Lead Examiner'), (req: Request, res: Response) => {
  const result = db.runEngine(req.params.id);

  db.addAuditLog({
    actorEmail: req.user?.email || 'examiner@satsa.gov.in',
    actorName: req.user?.name || 'Dr. Arunima Sen',
    actorRole: req.user?.role || 'Lead Examiner',
    action: 'ANALYTICS_ENGINE_EXECUTED',
    targetType: 'ENGINE',
    targetId: req.params.id,
    metadata: { engineId: req.params.id, executionStatus: result?.status || 'COMPLETED' }
  });

  res.json(result);
});


