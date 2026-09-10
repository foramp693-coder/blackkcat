#!/usr/bin/env python3
"""
SAT-SA — Supervisory Analytics Tool for SOC Assessment (SIH26157)
SQLite to PostgreSQL Data Migration & Verification Utility

Safely reads existing records from satsa_database.sqlite and migrates them
to the PostgreSQL target database with type conversions, topological foreign key ordering,
and row count verification.
"""

import os
import sys
import sqlite3
import json
import argparse
from typing import Dict, Any, List

# Try importing psycopg or psycopg2
try:
    import psycopg
    from psycopg.rows import dict_row
    USE_PSYCOPG3 = True
except ImportError:
    try:
        import psycopg2
        import psycopg2.extras
        USE_PSYCOPG3 = False
    except ImportError:
        print("[MIGRATION ERROR] Neither 'psycopg' nor 'psycopg2' is installed.")
        print("Please run: pip install psycopg[binary]")
        sys.exit(1)

MIGRATION_ORDER = [
    "users",
    "entities",
    "assets",
    "alerts",
    "cases",
    "investigations",
    "escalations",
    "closures",
    "findings",
    "finding_reviews",
    "ingestion_batches",
    "analytics_runs",
    "audit_logs"
]

def get_postgres_connection(db_url: str):
    """Establishes PostgreSQL connection using psycopg 3 or 2"""
    if USE_PSYCOPG3:
        return psycopg.connect(db_url, autocommit=False)
    else:
        return psycopg2.connect(db_url)

def inspect_sqlite(sqlite_path: str) -> Dict[str, int]:
    """Inspects SQLite database and returns table row counts"""
    if not os.path.exists(sqlite_path):
        raise FileNotFoundError(f"SQLite database file not found at: {sqlite_path}")
    
    conn = sqlite3.connect(sqlite_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [r[0] for r in cursor.fetchall()]
    
    counts = {}
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        counts[table] = cursor.fetchone()[0]
    conn.close()
    return counts

def read_sqlite_table(sqlite_path: str, table_name: str) -> List[Dict[str, Any]]:
    """Reads all rows from an SQLite table as dictionary list"""
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM {table_name};")
        rows = [dict(r) for r in cursor.fetchall()]
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()
    return rows

def ensure_postgres_schema(pg_conn):
    """Initializes schema if not already present in PostgreSQL"""
    schema_sql = """
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) NOT NULL,
      username VARCHAR(128) PRIMARY KEY,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(64) NOT NULL,
      access_level VARCHAR(32) NOT NULL,
      organization TEXT NOT NULL,
      badge_number VARCHAR(64),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS entities (
      id VARCHAR(64) PRIMARY KEY,
      name TEXT NOT NULL,
      code VARCHAR(64) UNIQUE NOT NULL,
      sector VARCHAR(128) NOT NULL,
      criticality_tier VARCHAR(64) NOT NULL,
      soc_contact TEXT,
      assessment_period VARCHAR(64) DEFAULT 'Q2-2026',
      status VARCHAR(64) DEFAULT 'Active Assessment',
      assessment_start TIMESTAMPTZ,
      assessment_end TIMESTAMPTZ,
      resilience_score NUMERIC(5,2) DEFAULT 78.50,
      total_alerts INT DEFAULT 0,
      total_cases INT DEFAULT 0,
      total_findings INT DEFAULT 0,
      last_analytics_run TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id VARCHAR(64) PRIMARY KEY,
      entity_id VARCHAR(64) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      timestamp TIMESTAMPTZ NOT NULL,
      source_tool VARCHAR(128) NOT NULL,
      severity VARCHAR(32) NOT NULL,
      category VARCHAR(128) NOT NULL,
      target_host VARCHAR(255),
      target_ip VARCHAR(64),
      analyst_id VARCHAR(64),
      status VARCHAR(64) DEFAULT 'NEW',
      triage_duration_sec INT DEFAULT 180,
      summary TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      raw_source TEXT,
      event_reference TEXT
    );

    CREATE TABLE IF NOT EXISTS cases (
      id VARCHAR(64) PRIMARY KEY,
      entity_id VARCHAR(64) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      alert_id VARCHAR(64) REFERENCES alerts(id) ON DELETE SET NULL,
      case_number VARCHAR(128),
      title TEXT,
      severity VARCHAR(32) NOT NULL,
      category VARCHAR(128) NOT NULL,
      status VARCHAR(64) NOT NULL,
      assigned_analyst VARCHAR(128),
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ,
      sla_breached BOOLEAN DEFAULT FALSE,
      sla_deadline TIMESTAMPTZ,
      raw_notes TEXT,
      attack_technique VARCHAR(128),
      priority VARCHAR(32),
      owner_analyst VARCHAR(128),
      escalation_flag BOOLEAN DEFAULT FALSE,
      sla_target_minutes INT DEFAULT 60
    );

    CREATE TABLE IF NOT EXISTS investigations (
      id VARCHAR(64) PRIMARY KEY,
      case_id VARCHAR(64) NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      analyst_id VARCHAR(64),
      started_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ,
      notes TEXT,
      hypothesis TEXT,
      actions_taken TEXT,
      tool_queries_run TEXT
    );

    CREATE TABLE IF NOT EXISTS escalations (
      id VARCHAR(64) PRIMARY KEY,
      case_id VARCHAR(64) NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      escalated_by VARCHAR(64),
      escalated_to VARCHAR(64),
      reason TEXT,
      escalated_at TIMESTAMPTZ NOT NULL,
      status VARCHAR(64),
      response_received_at TIMESTAMPTZ,
      response_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS closures (
      id VARCHAR(64) PRIMARY KEY,
      case_id VARCHAR(64) NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      closed_by VARCHAR(64),
      closed_at TIMESTAMPTZ NOT NULL,
      closure_category VARCHAR(128),
      justification TEXT,
      root_cause TEXT,
      preventive_action TEXT,
      supervisor_signoff BOOLEAN DEFAULT FALSE,
      signoff_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
      id VARCHAR(64) PRIMARY KEY,
      entity_id VARCHAR(64) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      hostname VARCHAR(255) NOT NULL,
      ip_address VARCHAR(64) NOT NULL,
      asset_type VARCHAR(64) NOT NULL,
      criticality VARCHAR(32) NOT NULL,
      owner_dept VARCHAR(128) NOT NULL,
      is_in_active_inventory BOOLEAN DEFAULT TRUE,
      last_scanned_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS findings (
      id VARCHAR(64) PRIMARY KEY,
      entity_id VARCHAR(64) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      case_id VARCHAR(64) REFERENCES cases(id) ON DELETE SET NULL,
      case_number VARCHAR(128),
      title TEXT NOT NULL,
      category VARCHAR(128) NOT NULL,
      severity VARCHAR(32) NOT NULL,
      priority_score NUMERIC(5,2) NOT NULL,
      priority_level VARCHAR(32) NOT NULL,
      confidence NUMERIC(5,2) NOT NULL,
      evidence_strength NUMERIC(5,2) NOT NULL,
      what_happened TEXT NOT NULL,
      why_flagged TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      review_status VARCHAR(64) DEFAULT 'Pending Review',
      reviewed_by VARCHAR(128),
      reviewer_role VARCHAR(64),
      review_notes TEXT,
      reviewed_at TIMESTAMPTZ,
      detection_rule_id VARCHAR(128),
      examiner_priority_json JSONB,
      score_explanation_json JSONB,
      supporting_evidence_json JSONB,
      missing_evidence_json JSONB,
      alternative_explanations_json JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS finding_reviews (
      id VARCHAR(64) PRIMARY KEY,
      finding_id VARCHAR(64) NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
      status VARCHAR(64) NOT NULL,
      reviewer_name VARCHAR(128) NOT NULL,
      reviewer_role VARCHAR(64) NOT NULL,
      notes TEXT,
      reviewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ingestion_batches (
      id VARCHAR(64) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      dataset_type VARCHAR(64) NOT NULL,
      uploaded_by VARCHAR(128) NOT NULL,
      uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      record_count INT DEFAULT 0,
      valid_count INT DEFAULT 0,
      invalid_count INT DEFAULT 0,
      status VARCHAR(64) DEFAULT 'VALIDATING',
      error_summary TEXT,
      assessment_period VARCHAR(64) DEFAULT 'Q2-2026'
    );

    CREATE TABLE IF NOT EXISTS analytics_runs (
      id VARCHAR(64) PRIMARY KEY,
      executed_by VARCHAR(128) NOT NULL,
      started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMPTZ,
      entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE SET NULL,
      total_evidence_records INT DEFAULT 0,
      cases_analyzed INT DEFAULT 0,
      findings_generated INT DEFAULT 0,
      status VARCHAR(64) DEFAULT 'RUNNING',
      execution_duration_ms INT DEFAULT 0,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      actor_email VARCHAR(255) NOT NULL,
      actor_name VARCHAR(128) NOT NULL,
      actor_role VARCHAR(64) NOT NULL,
      action VARCHAR(128) NOT NULL,
      target_type VARCHAR(64) NOT NULL,
      target_id VARCHAR(128) NOT NULL,
      metadata_json JSONB,
      ip_address VARCHAR(64)
    );
    """
    cursor = pg_conn.cursor()
    cursor.execute(schema_sql)
    pg_conn.commit()
    cursor.close()

def transform_row(table_name: str, row: Dict[str, Any]) -> Dict[str, Any]:
    """Converts SQLite integer booleans or string JSON to PostgreSQL compatible formats"""
    transformed = dict(row)
    
    # Boolean conversions
    if table_name == "users" and "active" in transformed:
        transformed["active"] = bool(transformed["active"])
    elif table_name == "cases":
        if "sla_breached" in transformed:
            transformed["sla_breached"] = bool(transformed["sla_breached"])
        if "escalation_flag" in transformed:
            transformed["escalation_flag"] = bool(transformed["escalation_flag"])
    elif table_name == "closures" and "supervisor_signoff" in transformed:
        transformed["supervisor_signoff"] = bool(transformed["supervisor_signoff"])
    elif table_name == "assets" and "is_in_active_inventory" in transformed:
        transformed["is_in_active_inventory"] = bool(transformed["is_in_active_inventory"])

    # JSON conversions (validate JSON syntax)
    for col in [
        "examiner_priority_json", "score_explanation_json",
        "supporting_evidence_json", "missing_evidence_json",
        "alternative_explanations_json", "metadata_json"
    ]:
        if col in transformed and transformed[col] is not None:
            val = transformed[col]
            if isinstance(val, str):
                try:
                    # Parse and re-serialize to normalize
                    parsed = json.loads(val)
                    transformed[col] = json.dumps(parsed)
                except Exception:
                    transformed[col] = None

    return transformed

def migrate_table(sqlite_path: str, pg_conn, table_name: str) -> int:
    """Migrates a single table from SQLite to PostgreSQL"""
    rows = read_sqlite_table(sqlite_path, table_name)
    if not rows:
        return 0

    cursor = pg_conn.cursor()
    inserted = 0

    for row in rows:
        clean_row = transform_row(table_name, row)
        columns = list(clean_row.keys())
        values = [clean_row[col] for col in columns]
        
        col_names = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))

        # Primary key conflict resolution
        pk = "username" if table_name == "users" else "id"
        
        insert_query = f"""
            INSERT INTO {table_name} ({col_names})
            VALUES ({placeholders})
            ON CONFLICT ({pk}) DO NOTHING;
        """
        cursor.execute(insert_query, values)
        inserted += 1

    pg_conn.commit()
    cursor.close()
    return inserted

def verify_counts(sqlite_path: str, pg_conn) -> bool:
    """Compares row counts between SQLite source and PostgreSQL target"""
    sqlite_counts = inspect_sqlite(sqlite_path)
    cursor = pg_conn.cursor()
    
    print("\n" + "=" * 60)
    print(f"{'TABLE NAME':<22} | {'SQLITE':<10} | {'POSTGRESQL':<10} | {'STATUS'}")
    print("-" * 60)
    
    all_match = True
    for table in MIGRATION_ORDER:
        src_count = sqlite_counts.get(table, 0)
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            dst_count = cursor.fetchone()[0]
        except Exception:
            dst_count = 0
            
        status = "MATCH" if src_count == dst_count else "DIVERGED"
        if status != "MATCH":
            all_match = False
            
        print(f"{table:<22} | {src_count:<10} | {dst_count:<10} | {status}")

    print("=" * 60)
    cursor.close()
    return all_match

def main():
    parser = argparse.ArgumentParser(description="SAT-SA SQLite to PostgreSQL Migrator")
    parser.add_argument("--sqlite", default=os.getenv("SQLITE_PATH", "satsa_database.sqlite"), help="Path to SQLite DB file")
    parser.add_argument("--postgres-url", default=os.getenv("DATABASE_URL"), help="PostgreSQL connection URL")
    args = parser.parse_args()

    sqlite_file = os.path.abspath(args.sqlite)
    pg_url = args.postgres_url or (
        f"postgresql://{os.getenv('POSTGRES_USER', 'satsa_user')}:"
        f"{os.getenv('POSTGRES_PASSWORD', 'change_me_sih2026')}@"
        f"{os.getenv('POSTGRES_HOST', 'localhost')}:"
        f"{os.getenv('POSTGRES_PORT', '5432')}/"
        f"{os.getenv('POSTGRES_DB', 'satsa')}"
    )

    print(f"[MIGRATION] Reading SQLite source: {sqlite_file}")
    print(f"[MIGRATION] Target PostgreSQL URL: {pg_url.split('@')[-1] if '@' in pg_url else 'specified'}")

    try:
        sqlite_counts = inspect_sqlite(sqlite_file)
        print(f"[MIGRATION] Found {len(sqlite_counts)} SQLite tables.")
    except Exception as e:
        print(f"[MIGRATION ERROR] Failed inspecting SQLite: {e}")
        sys.exit(1)

    try:
        pg_conn = get_postgres_connection(pg_url)
        print("[MIGRATION] Connected to PostgreSQL successfully.")
    except Exception as e:
        print(f"[MIGRATION ERROR] Failed connecting to PostgreSQL: {e}")
        print("Ensure PostgreSQL is running and credentials in DATABASE_URL are correct.")
        sys.exit(1)

    print("[MIGRATION] Initializing PostgreSQL schema...")
    ensure_postgres_schema(pg_conn)

    print("[MIGRATION] Migrating tables in topological foreign-key order...")
    for table in MIGRATION_ORDER:
        if table in sqlite_counts:
            migrated = migrate_table(sqlite_file, pg_conn, table)
            print(f"  -> Migrated {table}: {migrated} rows processed")

    print("[MIGRATION] Verifying row count parity...")
    verified = verify_counts(sqlite_file, pg_conn)
    pg_conn.close()

    if verified:
        print("[MIGRATION SUCCESS] All tables migrated and verified successfully!")
    else:
        print("[MIGRATION WARNING] Some table row counts differed. Please inspect logs.")

if __name__ == "__main__":
    main()
