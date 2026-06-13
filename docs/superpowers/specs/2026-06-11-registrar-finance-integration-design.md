# Registrar Finance Integration Design

Date: 2026-06-11

## Scope

Establish secure data integration between registrar learner data and finance learner data in the existing NestJS backend. The integration uses REST endpoints and shared Prisma data access, not direct frontend database access.

## Architecture

The backend is the single integration boundary. Registrar remains the source of truth for learner identity, enrollment, grade level, section, academic year, and academic records. Finance remains the source of truth for fee templates, assessments, discounts, financial aid, payments, balances, and finance clearance.

All integrated reads and writes are scoped by `studentId` plus `academicYearId`.

## Endpoints

- `GET /integration/students/:studentId/finance-profile?academicYearId=...`
  - Returns registrar student summary, academic records for the same academic year, finance assessment, line items, payments, and clearance.
- `GET /integration/finance/clearance?academicYearId=...`
  - Returns student finance clearance list for registrar visibility.
- `POST /integration/finance/sync-student/:studentId`
  - Recomputes and mirrors the active academic year finance status into `Student.financeStatus`.
- `GET /integration/data-map`
  - Returns registrar-to-finance field mapping and role access notes.

## Security

- All endpoints require JWT.
- `FINANCE` can read learner summaries and trigger finance sync.
- `REGISTRAR` can read finance profile and clearance.
- `ADMIN` is allowed through the global admin override.
- No integration endpoint is public.

## Validation

- `academicYearId` is required for every integrated query.
- Student and assessment academic years must match.
- Missing students return 404.
- Missing finance assessment returns a profile with `finance.assessment` set to `null`.

## Logging

Add `IntegrationLog` records for integration operations.

Fields:

- `id`
- `action`
- `sourceModule`
- `targetModule`
- `studentId`
- `academicYearId`
- `status`
- `message`
- `performedById`
- `createdAt`

## Active-Year Mirror

The official finance clearance remains in `StudentAssessment.financeStatus` per academic year. For registrar list visibility, the active academic year finance status is mirrored into `Student.financeStatus` after assessment/payment sync only when the target academic year is active.

## Documentation

Create `docs/finance-registrar-integration.md` with endpoints, access matrix, data mapping, validation rules, and error behavior.
