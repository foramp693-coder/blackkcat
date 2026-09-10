# SAT-SA — Supervisory Analytics Tool for SOC Assessment
**Problem Statement:** SIH26157 | **Domain:** Cyber Security  
**Architecture:** Production Two-Container Docker Setup (App + PostgreSQL)

---

## 1. Architecture Overview

SAT-SA runs in a clean, isolated **Two-Container Architecture** orchestrated with Docker Compose:

```
                      +------------------------------------------+
                      |         HOST MACHINE (Browser / User)    |
                      |          http://localhost:8000           |
                      +--------------------+---------------------+
                                           |
                                           | HTTP Port 8000 -> 3000
                                           v
+---------------------------------------------------------------------------------------+
|  DOCKER NETWORK: satsa_network                                                        |
|                                                                                       |
|  +-------------------------------------+      +------------------------------------+  |
|  | CONTAINER 1: satsa_app              |      | CONTAINER 2: satsa_db              |  |
|  | (React Frontend + Analytics Backend)|      | (PostgreSQL 16 Relational Engine)  |  |
|  |                                     |      |                                    |  |
|  | - React 19 / TypeScript UI          |      | - Service Name: db                 |  |
|  | - Vite SPA Distribution             |      | - Port: 5432 (internal)            |  |
|  | - 32 Supervisory Analytics Engines  | TCP  | - Persistent Volume:               |  |
|  | - RBAC & JWT Authentication         |----->|   satsa_postgres_data              |  |
|  | - Immutable Audit Logging           | 5432 | - PostgreSQL Foreign Keys, WAL     |  |
|  | - REST API (/api/*)                 |      | - Automated Healthcheck Probes     |  |
|  +-------------------------------------+      +------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

### Container Details
- **Container 1 (`app` / `satsa_app`)**:
  - Contains the compiled React/TypeScript frontend and the Node.js/TypeScript supervisory analytics server.
  - Serves static assets, API endpoints (`/api/*`), and health endpoints.
  - Connects securely to the database container using internal Docker network DNS name `db`.
- **Container 2 (`db` / `satsa_db`)**:
  - Official `postgres:16-alpine` database image.
  - Houses all persistent entities, alerts, cases, investigations, escalations, closures, assets, findings, reviews, and immutable audit logs.
  - Backed by named volume `satsa_postgres_data`.

---

## 2. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/) (v2.0 or higher)
- (Optional for standalone host execution) Node.js 20+ and Python 3.10+

---

## 3. Quick Start with Docker Compose

### 1. Configure Environment Variables
Copy the template configuration:
```bash
cp .env.example .env
```

### 2. Build and Launch the Containers
```bash
docker compose up --build -d
```

### 3. Verify Container Status
```bash
docker compose ps
```
You will see two healthy services:
- `satsa_app` (Up, port `0.0.0.0:8000->3000/tcp`)
- `satsa_db` (Up, healthy)

### 4. Open in Browser
Visit **[http://localhost:8000](http://localhost:8000)** to access the SAT-SA supervisory analytics platform.

---

## 4. Verification & Health Probes

Verify that both the application and the database connection are healthy:
```bash
curl http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "databaseEngine": "PostgreSQL 16 (Relational Multi-Container)",
  "platform": "SAT-SA Supervisory Analytics",
  "sih": "SIH26157",
  "integrityStatus": "ok",
  "timestamp": "2026-09-10T12:00:00.000Z"
}
```

---

## 5. Demo Credentials (Role-Based Access Control)

| Role | Username | Demo Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Lead Examiner** | `lead.examiner` | `examiner123` | Full audit, supervisory reviews, data ingestion, analytics execution |
| **SOC Supervisor**| `soc.supervisor`| `supervisor123`| Case workflow inspection, operational reviews, entity alerts |
| **Auditor**       | `auditor`       | `auditor123`   | Read-only evidence inspection, report generation, audit trail verification |

---

## 6. Managing the Deployment

### View Live Logs
```bash
# View aggregated logs for both containers
docker compose logs -f

# View application container logs only
docker compose logs -f app

# View PostgreSQL container logs only
docker compose logs -f db
```

### Stop Containers
```bash
# Graceful stop
docker compose down

# Stop and wipe persistent database volume (Warning: destructive)
docker compose down -v
```

---

## 7. Database Migration (SQLite to PostgreSQL)

If you have existing historical data in `satsa_database.sqlite`:

### Run Migration with Python:
```bash
python3 scripts/migrate_sqlite_to_postgres.py --sqlite satsa_database.sqlite --postgres-url postgresql://satsa_user:change_me_sih2026@localhost:5432/satsa
```

### Or Run Migration with TypeScript / Node:
```bash
DATABASE_URL=postgresql://satsa_user:change_me_sih2026@localhost:5432/satsa npx tsx scripts/migrate_sqlite_to_postgres.ts
```

The migration utility:
1. Traverses relational entities in topological order (`users` -> `entities` -> `assets` -> `alerts` -> `cases` -> `investigations` -> `escalations` -> `closures` -> `findings` -> `finding_reviews` -> `ingestion_batches` -> `analytics_runs` -> `audit_logs`).
2. Converts SQLite types (integer booleans, JSON text) into PostgreSQL native types.
3. Automatically validates row counts: **SQLite count == PostgreSQL count**.

---

## 8. Backup & Restore Operations

### Backup PostgreSQL Database:
```bash
docker exec -t satsa_db pg_dump -U satsa_user -d satsa > satsa_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore PostgreSQL Database:
```bash
cat satsa_backup_20260910.sql | docker exec -i satsa_db psql -U satsa_user -d satsa
```

### Inspect PostgreSQL Shell:
```bash
docker exec -it satsa_db psql -U satsa_user -d satsa
```

---

## 9. Troubleshooting

1. **Port 8000 already in use**:
   Change `HOST_PORT=8080` in `.env` and rerun `docker compose up -d`. Access at `http://localhost:8080`.
2. **Database health check fails**:
   Inspect PostgreSQL startup logs:
   ```bash
   docker compose logs db
   ```
   Ensure password in `.env` matches credentials in `docker-compose.yml`.
3. **Application cannot connect to PostgreSQL**:
   Verify the database service name is `db` inside `DATABASE_URL` (`postgresql://satsa_user:...@db:5432/satsa`). Do not use `localhost` inside the application container.
