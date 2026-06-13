# Finance Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local finance portal with academic-year-safe fee setup, assessments, payments, ledger, and clearance updates.

**Architecture:** Add a focused NestJS `FinanceModule` with all finance business rules centralized in `FinanceService`. Add Prisma finance models with academic-year and payment constraints. Add Angular standalone finance pages that consume the finance API and replace the existing placeholders.

**Tech Stack:** NestJS 11, Prisma 5, SQLite, Jest, Angular 20 standalone components, RxJS, SCSS/Tailwind utility classes already used by the app.

---

### Task 1: Backend Finance Rules

**Files:**
- Create: `sms-nestjs-backend/src/finance/finance.service.spec.ts`
- Create: `sms-nestjs-backend/src/finance/finance.service.ts`
- Create: `sms-nestjs-backend/src/finance/finance.controller.ts`
- Create: `sms-nestjs-backend/src/finance/finance.module.ts`
- Modify: `sms-nestjs-backend/src/app.module.ts`

- [ ] Write failing Jest tests for discount cap, one active assessment per student/year, partial payment, exact payment clearance, overpayment block, cross-year payment block, duplicate receipt per year, and used setup delete conflict.
- [ ] Run `npm test -- finance.service.spec.ts --runInBand` and verify the tests fail because finance code/schema is not implemented.
- [ ] Implement `FinanceService` and `FinanceController` with DTO-like TypeScript interfaces, role guard decorators, and explicit `BadRequestException`, `ConflictException`, and `NotFoundException` business errors.
- [ ] Register `FinanceModule` in `AppModule`.
- [ ] Run `npm test -- finance.service.spec.ts --runInBand` and verify the tests pass.

### Task 2: Prisma Finance Schema

**Files:**
- Modify: `sms-nestjs-backend/prisma/schema.prisma`

- [ ] Add `FeeType`, `FeeTemplate`, `FeeTemplateLineItem`, `StudentAssessment`, `StudentAssessmentLineItem`, `Payment`, and `PaymentReceiptAudit`.
- [ ] Add relations from `Student`, `AcademicYear`, and `User` where needed.
- [ ] Add unique constraints for one assessment per student/year and receipt number per academic year.
- [ ] Run `npx prisma generate`.
- [ ] Run `npx prisma db push`.
- [ ] Run `npm run build`.

### Task 3: Frontend API And Routes

**Files:**
- Create: `sms-angular-dashboard-starter/src/app/core/models/finance.models.ts`
- Create: `sms-angular-dashboard-starter/src/app/core/services/finance-api.service.ts`
- Modify: `sms-angular-dashboard-starter/src/app/app.routes.ts`
- Modify: `sms-angular-dashboard-starter/src/app/core/data/dashboard.mock.ts`

- [ ] Add finance TypeScript interfaces for fee types, templates, assessments, payments, ledger, and payloads.
- [ ] Add `FinanceApiService` methods for the approved finance endpoints.
- [ ] Replace the placeholder finance routes with the new finance components.
- [ ] Add a Finance Setup navigation target.
- [ ] Run `npm run build` and fix compile errors before moving on.

### Task 4: Finance Pages

**Files:**
- Create: `sms-angular-dashboard-starter/src/app/pages/finance/finance-shell.scss`
- Create: `sms-angular-dashboard-starter/src/app/pages/finance/billing-assessment/*`
- Create: `sms-angular-dashboard-starter/src/app/pages/finance/payments/*`
- Create: `sms-angular-dashboard-starter/src/app/pages/finance/student-ledger/*`
- Create: `sms-angular-dashboard-starter/src/app/pages/finance/finance-setup/*`

- [ ] Build Billing & Assessment with academic year selector, student selector, template selector, discount fields, computed totals, and save assessment action.
- [ ] Build Payments with assessment selector, remaining balance display, receipt number, method, amount validation, and save payment action.
- [ ] Build Student Ledger with student/year filter, assessment lines, discounts, payment history, balance, and clearance.
- [ ] Build Finance Setup with fee type CRUD/deactivate and fee template CRUD/deactivate.
- [ ] Keep UI dense, operational, and consistent with the current dashboard.
- [ ] Run `npm run build` and fix compile errors.

### Task 5: Local Verification

**Files:**
- Use existing app folders and running local ports.

- [ ] Run backend tests: `npm test -- --runInBand`.
- [ ] Run backend build: `npm run build`.
- [ ] Run frontend build: `npm run build`.
- [ ] Restart backend on `http://127.0.0.1:3000` if needed.
- [ ] Restart frontend on `http://127.0.0.1:4200` if needed.
- [ ] Use the browser to open the finance routes and verify Billing & Assessment, Payments, Student Ledger, and Finance Setup render locally.
