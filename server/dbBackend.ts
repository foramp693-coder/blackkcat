/**
 * SAT-SA — Supervisory Analytics Tool for SOC Assessment (SIH26157)
 * Unified Database Backend Adapter (PostgreSQL Primary with SQLite Fallback)
 *
 * Automatically detects if PostgreSQL (DATABASE_URL) is configured:
 * - When in Docker or PostgreSQL mode: Uses PostgreSQL via pg.Pool
 * - When in local standalone mode without PostgreSQL: Uses SQLite via node:sqlite
 */

import { sqliteDb } from './sqlite';
import { postgresDb } from './postgres';
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

export class UnifiedDatabaseBackend {
  private usePostgres: boolean = false;
  private initialized: boolean = false;

  constructor() {
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || process.env.POSTGRES_HOST) {
      this.usePostgres = true;
    }
  }

  public isPostgresActive(): boolean {
    return this.usePostgres;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    if (this.usePostgres) {
      console.log('[DB-Adapter] Testing PostgreSQL connection on:', process.env.DATABASE_URL || 'db:5432');
      const connected = await postgresDb.waitForConnection(5, 1000);
      if (connected) {
        await postgresDb.initializeSchema();
        this.initialized = true;
        console.log('[DB-Adapter] PostgreSQL mode active & initialized.');
        return;
      } else {
        console.warn('[DB-Adapter] PostgreSQL unavailable, falling back to SQLite persistence.');
        this.usePostgres = false;
      }
    }

    sqliteDb.initializeSchema();
    this.initialized = true;
    console.log('[DB-Adapter] SQLite mode active & initialized.');
  }

  public async seedPresetUsers(users: User[]): Promise<void> {
    sqliteDb.seedPresetUsers(users);
    if (this.usePostgres) {
      try {
        await postgresDb.seedPresetUsers(users);
      } catch (err: any) {
        console.warn('[DB-Adapter] PostgreSQL user seed warning:', err.message);
      }
    }
  }

  public async syncDatasetToDatabase(
    entities: Entity[],
    alerts: Alert[],
    cases: Case[],
    investigations: Investigation[],
    escalations: Escalation[],
    closures: Closure[],
    assets: Asset[] = [],
    findings: SupervisoryFinding[] = [],
    auditLogs: AuditEvent[] = []
  ): Promise<void> {
    sqliteDb.syncDatasetToDatabase(
      entities,
      alerts,
      cases,
      investigations,
      escalations,
      closures,
      assets,
      findings,
      auditLogs
    );

    if (this.usePostgres) {
      try {
        await postgresDb.syncDatasetToDatabase(
          entities,
          alerts,
          cases,
          investigations,
          escalations,
          closures,
          assets,
          findings,
          auditLogs
        );
      } catch (err: any) {
        console.error('[DB-Adapter] PostgreSQL dataset sync error:', err.message);
      }
    }
  }

  public async transactionalIngestCustom(
    batchId: string,
    filename: string,
    uploader: string,
    datasetType: string,
    records: { cases?: Case[]; alerts?: Alert[]; assets?: Asset[]; entities?: Entity[] }
  ): Promise<{ success: boolean; recordsImported: number; error?: string }> {
    if (this.usePostgres) {
      try {
        const pgResult = await postgresDb.transactionalIngestCustom(batchId, filename, uploader, datasetType, {
          cases: records.cases || [],
          alerts: records.alerts || []
        });
        if (pgResult.success) {
          sqliteDb.transactionalIngestCustom(batchId, filename, uploader, datasetType, records);
          return pgResult;
        }
      } catch (err: any) {
        console.warn('[DB-Adapter] PostgreSQL ingest failed, trying SQLite fallback:', err.message);
      }
    }
    return sqliteDb.transactionalIngestCustom(batchId, filename, uploader, datasetType, records);
  }

  public async recordFindingReview(
    findingId: string,
    status: string,
    reviewerName: string,
    reviewerRole: string,
    notes: string
  ): Promise<void> {
    sqliteDb.recordFindingReview(findingId, status, reviewerName, reviewerRole, notes);
    if (this.usePostgres) {
      try {
        await postgresDb.recordFindingReview(findingId, status, reviewerName, reviewerRole, notes);
      } catch (err: any) {
        console.error('[DB-Adapter] PostgreSQL review record error:', err.message);
      }
    }
  }

  public async getFindingReviews(findingId: string): Promise<FindingReviewRecord[]> {
    if (this.usePostgres) {
      try {
        return await postgresDb.getFindingReviews(findingId);
      } catch (err: any) {
        console.warn('[DB-Adapter] Falling back to SQLite for reviews:', err.message);
      }
    }
    return sqliteDb.getFindingReviews(findingId);
  }

  public async getAssets(entityId?: string): Promise<Asset[]> {
    if (this.usePostgres) {
      try {
        return await postgresDb.getAssets(entityId);
      } catch (err: any) {
        console.warn('[DB-Adapter] Falling back to SQLite for assets:', err.message);
      }
    }
    return sqliteDb.getAssets(entityId);
  }

  public async recordAnalyticsRunStart(run: { id: string; executed_by: string; entity_id?: string }): Promise<void> {
    sqliteDb.recordAnalyticsRunStart(run);
    if (this.usePostgres) {
      try {
        await postgresDb.recordAnalyticsRunStart(run);
      } catch (err: any) {
        console.error('[DB-Adapter] PostgreSQL run start record error:', err.message);
      }
    }
  }

  public async recordAnalyticsRunComplete(
    runId: string,
    stats: { total_evidence: number; cases_analyzed: number; findings_count: number; duration_ms: number; error?: string }
  ): Promise<void> {
    sqliteDb.recordAnalyticsRunComplete(runId, stats.total_evidence, stats.cases_analyzed, stats.findings_count, stats.error ? 'FAILED' : 'COMPLETED', stats.error);
    if (this.usePostgres) {
      try {
        await postgresDb.recordAnalyticsRunComplete(runId, stats);
      } catch (err: any) {
        console.error('[DB-Adapter] PostgreSQL run complete record error:', err.message);
      }
    }
  }

  public async getAnalyticsRuns(limit: number = 50): Promise<AnalyticsRunRecord[]> {
    if (this.usePostgres) {
      try {
        return await postgresDb.getAnalyticsRuns(limit);
      } catch (err: any) {
        console.warn('[DB-Adapter] Falling back to SQLite for runs:', err.message);
      }
    }
    return sqliteDb.getAnalyticsRuns(limit);
  }

  public async recordIngestionBatch(batch: IngestionBatch): Promise<void> {
    sqliteDb.recordIngestionBatch(batch);
    if (this.usePostgres) {
      try {
        await postgresDb.recordIngestionBatch(batch);
      } catch (err: any) {
        console.error('[DB-Adapter] PostgreSQL batch record error:', err.message);
      }
    }
  }

  public async getIngestionBatches(limit: number = 50): Promise<IngestionBatch[]> {
    if (this.usePostgres) {
      try {
        return await postgresDb.getIngestionBatches(limit);
      } catch (err: any) {
        console.warn('[DB-Adapter] Falling back to SQLite for batches:', err.message);
      }
    }
    return sqliteDb.getIngestionBatches(limit);
  }

  public async logAuditEvent(event: AuditEvent): Promise<void> {
    sqliteDb.logAuditEvent(event);
    if (this.usePostgres) {
      try {
        await postgresDb.logAuditEvent(event);
      } catch (err: any) {
        console.error('[DB-Adapter] PostgreSQL audit log error:', err.message);
      }
    }
  }

  public async getAuditLogs(actorRole?: string, limit: number = 100): Promise<AuditEvent[]> {
    if (this.usePostgres) {
      try {
        return await postgresDb.getAuditLogs(actorRole, limit);
      } catch (err: any) {
        console.warn('[DB-Adapter] Falling back to SQLite for audit logs:', err.message);
      }
    }
    return sqliteDb.getAuditLogs(actorRole, limit);
  }

  public async getDatabaseHealth(): Promise<Record<string, any>> {
    if (this.usePostgres) {
      return await postgresDb.getDatabaseHealth();
    }
    return sqliteDb.getDatabaseHealth();
  }

  public async exportDatabaseDossier(): Promise<Record<string, any>> {
    if (this.usePostgres) {
      return await postgresDb.exportDatabaseDossier();
    }
    return sqliteDb.exportDatabaseDossier();
  }

  public async resetSyntheticData(): Promise<void> {
    sqliteDb.resetSyntheticData();
    if (this.usePostgres) {
      await postgresDb.resetSyntheticData();
    }
  }
}

export const dbBackend = new UnifiedDatabaseBackend();
