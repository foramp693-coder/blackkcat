"""
SAT-SA — Supervisory Analytics Tool for SOC Assessment
Problem Statement: SIH26157 | Domain: Cyber Security
FastAPI PostgreSQL & Supervisory Analytics Backend Implementation
"""

import os
import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, Header, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="SAT-SA — Supervisory Analytics Tool for SOC Assessment",
    description="Explainable supervisory analytics platform for periodic SOC operational evidence review (SIH26157)",
    version="2.0.0"
)

# CORS Configuration
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000")
allowed_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_database_connection():
    """Returns database connection based on DATABASE_URL or SQLite fallback"""
    db_url = os.getenv("DATABASE_URL")
    if db_url and (db_url.startswith("postgres://") or db_url.startswith("postgresql://")):
        try:
            import psycopg
            conn = psycopg.connect(db_url, connect_timeout=3)
            return conn, "PostgreSQL 16"
        except Exception as e:
            try:
                import psycopg2
                conn = psycopg2.connect(db_url, connect_timeout=3)
                return conn, "PostgreSQL 16"
            except Exception:
                return None, f"PostgreSQL Error: {e}"
    else:
        # SQLite fallback
        sqlite_file = os.getenv("SQLITE_PATH", "satsa_database.sqlite")
        if os.path.exists(sqlite_file):
            import sqlite3
            conn = sqlite3.connect(sqlite_file)
            return conn, "SQLite 3"
        return None, "No Database File Found"

@app.get("/api/health")
def health_check(response: Response):
    conn, engine_name = get_database_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1;")
            cur.fetchone()
            conn.close()
            return {
                "status": "ok",
                "database": "connected",
                "databaseEngine": engine_name,
                "platform": "SAT-SA Supervisory Analytics (FastAPI Service)",
                "sih": "SIH26157",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        except Exception as e:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {
                "status": "degraded",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
    else:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "degraded",
            "database": "disconnected",
            "detail": engine_name,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

@app.get("/")
def root():
    return {
        "platform": "SAT-SA Supervisory Analytics API",
        "problemStatement": "SIH26157",
        "documentation": "/docs"
    }
