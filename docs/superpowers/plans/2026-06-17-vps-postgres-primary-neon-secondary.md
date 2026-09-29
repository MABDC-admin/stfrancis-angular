# VPS Postgres Primary + Neon Secondary Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the SFXSAI school system to the VPS with Docker, use VPS PostgreSQL as the primary write database, and keep Neon as a secondary logical replica.

**Architecture:** The Angular frontend is served by Nginx in a container and proxies `/api` and `/storage` to the Nest backend container. The backend connects to a standard PostgreSQL instance on the VPS, not directly to Neon HTTP. Neon remains a downstream logical subscriber fed by VPS PostgreSQL publication(s).

**Tech Stack:** Angular, NestJS, Docker Compose, PostgreSQL, Prisma migrations, Drizzle ORM, Nginx, Neon logical replication

---

### Task 1: Make backend DB access work with standard PostgreSQL

**Files:**
- Modify: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\drizzle\drizzle.service.ts`
- Test: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\prisma\prisma.service.spec.ts`

- [ ] **Step 1: Write the failing transport test**

Add a focused test that proves the service no longer depends on Neon HTTP-only transport assumptions and can initialize from a plain PostgreSQL URL.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- prisma.service.spec.ts --runInBand`
Expected: FAIL because the current Drizzle service uses `@neondatabase/serverless` and `drizzle-orm/neon-http`.

- [ ] **Step 3: Write minimal implementation**

Replace the Neon HTTP-specific Drizzle bootstrap with a standard Postgres driver bootstrap compatible with VPS PostgreSQL while keeping `DATABASE_URL` as the single source of connection truth.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- prisma.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sms-nestjs-backend/src/drizzle/drizzle.service.ts sms-nestjs-backend/src/prisma/prisma.service.spec.ts
git commit -m "fix: support standard postgres for backend runtime"
```

### Task 2: Add VPS production compose and DB env contract

**Files:**
- Modify: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\docker-compose.coolify.yml`
- Create: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\docker-compose.vps.yml`
- Create: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\.env.vps.example`

- [ ] **Step 1: Write the failing deployment expectation**

Define the target stack:
- `postgres` service for primary DB
- `api` service depending on Postgres
- `web` service depending on API
- persistent volumes for DB and uploads

- [ ] **Step 2: Verify current compose is insufficient**

Run: `docker compose -f docker-compose.coolify.yml config`
Expected: PASS, but no `postgres` service present and no replication-related environment contract.

- [ ] **Step 3: Write minimal implementation**

Create a VPS-specific compose file with:
- `postgres:16`
- named volume for `PGDATA`
- backend env wired to VPS Postgres
- frontend and backend services matching existing Dockerfiles

- [ ] **Step 4: Verify compose renders**

Run: `docker compose -f docker-compose.vps.yml config`
Expected: PASS with `postgres`, `api`, and `web` services resolved

- [ ] **Step 5: Commit**

```bash
git add docker-compose.vps.yml .env.vps.example docker-compose.coolify.yml
git commit -m "feat: add vps docker stack with postgres primary"
```

### Task 3: Add replication setup scripts and operator docs

**Files:**
- Create: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\scripts\setup-vps-postgres-replication.sh`
- Create: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\scripts\setup-neon-subscription.sql`
- Create: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\docs\VPS_POSTGRES_NEON_REPLICATION.md`

- [ ] **Step 1: Write the failing operator expectation**

Document the exact requirement:
- VPS Postgres publishes
- Neon subscribes
- no app writes to Neon

- [ ] **Step 2: Verify there is no existing replication automation**

Run: `rg -n "CREATE PUBLICATION|CREATE SUBSCRIPTION|wal_level|logical" scripts docs sms-nestjs-backend -S`
Expected: no complete VPS-to-Neon replication setup

- [ ] **Step 3: Write minimal implementation**

Add:
- shell script for VPS-side publication prerequisites
- SQL template for Neon-side subscription creation
- operator doc with cut-and-paste commands and verification queries

- [ ] **Step 4: Verify script/doc presence**

Run: `Get-Content scripts/setup-vps-postgres-replication.sh; Get-Content docs/VPS_POSTGRES_NEON_REPLICATION.md`
Expected: files present with concrete commands

- [ ] **Step 5: Commit**

```bash
git add scripts/setup-vps-postgres-replication.sh scripts/setup-neon-subscription.sql docs/VPS_POSTGRES_NEON_REPLICATION.md
git commit -m "docs: add vps to neon replication setup assets"
```

### Task 4: Deploy to VPS and validate runtime

**Files:**
- Modify: `D:\SFXSAI-APPWRITE\CODEX_WORKLOG.md`

- [ ] **Step 1: Verify VPS access and baseline**

Run commands on VPS to confirm:
- OS
- Docker availability
- disk/memory
- open ports
- existing Postgres state

- [ ] **Step 2: Upload project and env**

Copy the school project to a dedicated VPS directory such as `/opt/stfrancis-angular` and place the VPS env file there.

- [ ] **Step 3: Start stack**

Run: `docker compose -f docker-compose.vps.yml up -d --build`
Expected: `postgres`, `api`, and `web` come up healthy

- [ ] **Step 4: Verify app and database**

Run:
- container health checks
- backend login/API check
- write a test record or verify a known query
- verify data lands in VPS Postgres

- [ ] **Step 5: Record deployment evidence**

Append the deployed paths, compose file used, published ports, and verification evidence to `D:\SFXSAI-APPWRITE\CODEX_WORKLOG.md`

### Task 5: Configure Neon as secondary replica and verify sync

**Files:**
- Modify: `D:\SFXSAI-APPWRITE\CODEX_WORKLOG.md`

- [ ] **Step 1: Enable publication on VPS Postgres**

Run the publication setup script and confirm `wal_level=logical`, replication user, and publication are active.

- [ ] **Step 2: Create Neon subscription**

Run the generated SQL against Neon using the user-provided Neon connection target adjusted for logical replication requirements.

- [ ] **Step 3: Verify replication state**

Run publisher/subscriber queries:
- on VPS: publication/slot status
- on Neon: subscription state and row visibility

- [ ] **Step 4: Prove replicated data flow**

Insert or update a controlled row on VPS primary, then verify the change appears in Neon.

- [ ] **Step 5: Record final operational notes**

Document:
- active primary DB endpoint
- Neon secondary role
- manual failover note
- replication verification evidence

## Self-Review

- Spec coverage: covers runtime driver change, Docker stack, VPS deployment, and Neon secondary replication.
- Placeholder scan: no TODO/TBD placeholders remain.
- Type consistency: plan consistently uses `DATABASE_URL`, Docker Compose, Prisma migrations, and Drizzle runtime update terminology.
