# Registrar Finance Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure registrar-finance integration APIs, audit logging, active-year finance status mirroring, and endpoint/data mapping documentation.

**Architecture:** Implement a dedicated NestJS `IntegrationModule` that reads registrar and finance data through Prisma and logs integration operations. Extend the finance payment workflow to mirror active-year clearance to `Student.financeStatus` while preserving per-academic-year `StudentAssessment.financeStatus` as the source of truth.

**Tech Stack:** NestJS 11, Prisma 5, SQLite, Jest, REST, Markdown docs.

---

### Task 1: Integration Schema

**Files:**
- Modify: `sms-nestjs-backend/prisma/schema.prisma`

- [ ] Add `IntegrationLog` model with action, source module, target module, student, academic year, status, message, performedBy, and timestamp.
- [ ] Run `npx prisma validate`.
- [ ] Run `npx prisma generate`.
- [ ] Run `npx prisma db push`.

### Task 2: Integration Service And Controller

**Files:**
- Create: `sms-nestjs-backend/src/integration/integration.service.spec.ts`
- Create: `sms-nestjs-backend/src/integration/integration.service.ts`
- Create: `sms-nestjs-backend/src/integration/integration.controller.ts`
- Create: `sms-nestjs-backend/src/integration/integration.module.ts`
- Modify: `sms-nestjs-backend/src/app.module.ts`

- [ ] Write failing tests for required academic year validation, finance profile composition, clearance list, active-year sync mirror, and integration logging.
- [ ] Run `npm test -- integration.service.spec.ts --runInBand` and verify RED.
- [ ] Implement service/controller/module.
- [ ] Register `IntegrationModule`.
- [ ] Run `npm test -- integration.service.spec.ts --runInBand` and verify GREEN.

### Task 3: Finance Payment Mirror

**Files:**
- Modify: `sms-nestjs-backend/src/finance/finance.service.spec.ts`
- Modify: `sms-nestjs-backend/src/finance/finance.service.ts`

- [ ] Add failing test that final payment in active academic year mirrors `Cleared` into `Student.financeStatus`.
- [ ] Implement mirror update only when the academic year is active.
- [ ] Run finance tests and verify GREEN.

### Task 4: Documentation And Verification

**Files:**
- Create: `docs/finance-registrar-integration.md`

- [ ] Write endpoint list, access matrix, data mapping, validation, logging, and error handling documentation.
- [ ] Run full backend tests.
- [ ] Run backend build.
- [ ] Run live API smoke check for the new integration endpoints using Finance credentials.
