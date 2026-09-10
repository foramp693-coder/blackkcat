/**
 * SAT-SA — Supervisory Analytics Tool for SOC Assessment (SIH26157)
 * TypeScript Migration Script: SQLite -> PostgreSQL
 *
 * Runs via: npx tsx scripts/migrate_sqlite_to_postgres.ts
 */

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { Pool } from 'pg';

const SQLITE_FILE = path.resolve(process.cwd(), process.env.SQLITE_PATH || 'satsa_database.sqlite');
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || 'satsa_user'}:${process.env.POSTGRES_PASSWORD || 'change_me_sih2026'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'satsa'}`;

const TABLES_IN_ORDER = [
  'users',
  'entities',
  'assets',
  'alerts',
  'cases',
  'investigations',
  'escalations',
  'closures',
  'findings',
  'finding_reviews',
  'ingestion_batches',
  'analytics_runs',
  'audit_logs'
];

async function runMigration() {
  console.log('[MIGRATION-TS] Starting SQLite to PostgreSQL migration...');
  console.log(`[MIGRATION-TS] Source SQLite: ${SQLITE_FILE}`);
  console.log(`[MIGRATION-TS] Target PostgreSQL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  if (!fs.existsSync(SQLITE_FILE)) {
    console.error(`[MIGRATION-TS ERROR] Source SQLite database file not found at ${SQLITE_FILE}`);
    process.exit(1);
  }

  const sqlite = new DatabaseSync(SQLITE_FILE);
  const pool = new Pool({ connectionString: DATABASE_URL });

  const client = await pool.connect();

  try {
    // 1. Inspect SQLite tables
    console.log('[MIGRATION-TS] Reading source table counts...');
    const sourceCounts: Record<string, number> = {};
    for (const table of TABLES_IN_ORDER) {
      try {
        const row = sqlite.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any;
        sourceCounts[table] = row.count;
      } catch {
        sourceCounts[table] = 0;
      }
    }

    // 2. Migrate each table
    for (const table of TABLES_IN_ORDER) {
      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all() as any[];
      if (rows.length === 0) continue;

      console.log(`[MIGRATION-TS] Migrating ${rows.length} records into ${table}...`);

      for (const row of rows) {
        // Boolean conversions
        if (table === 'users' && 'active' in row) row.active = Boolean(row.active);
        if (table === 'cases') {
          if ('sla_breached' in row) row.sla_breached = Boolean(row.sla_breached);
          if ('escalation_flag' in row) row.escalation_flag = Boolean(row.escalation_flag);
        }
        if (table === 'closures' && 'supervisor_signoff' in row) row.supervisor_signoff = Boolean(row.supervisor_signoff);
        if (table === 'assets' && 'is_in_active_inventory' in row) row.is_in_active_inventory = Boolean(row.is_in_active_inventory);

        const columns = Object.keys(row);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const pk = table === 'users' ? 'username' : 'id';

        const sql = `
          INSERT INTO ${table} (${columns.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT (${pk}) DO NOTHING;
        `;
        await client.query(sql, Object.values(row));
      }
    }

    // 3. Verification report
    console.log('\n================================================================');
    console.log(`${'TABLE NAME'.padEnd(22)} | ${'SQLITE'.padEnd(10)} | ${'POSTGRES'.padEnd(10)} | STATUS`);
    console.log('----------------------------------------------------------------');

    let allMatch = true;
    for (const table of TABLES_IN_ORDER) {
      const src = sourceCounts[table] || 0;
      const res = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      const dst = parseInt(res.rows[0].count, 10);
      const match = src === dst;
      if (!match) allMatch = false;

      console.log(`${table.padEnd(22)} | ${src.toString().padEnd(10)} | ${dst.toString().padEnd(10)} | ${match ? 'MATCH' : 'DIVERGED'}`);
    }
    console.log('================================================================\n');

    if (allMatch) {
      console.log('[MIGRATION-TS SUCCESS] All tables migrated and verified successfully.');
    } else {
      console.warn('[MIGRATION-TS WARNING] Some table row counts differed.');
    }
  } catch (err: any) {
    console.error('[MIGRATION-TS ERROR]:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
