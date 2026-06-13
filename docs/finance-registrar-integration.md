# Finance and Registrar Integration

Date: 2026-06-11

## Purpose

This integration connects registrar learner data with finance learner data through secure backend REST APIs. The frontend must not access the database directly. The NestJS backend is the integration boundary.

## Source of Truth

| Area | Source |
| --- | --- |
| Student identity, LRN, student number | Registrar `Student` |
| Grade level, section, adviser | Registrar `Student` |
| Enrollment and academic year assignment | Registrar `Student.academicYearId` |
| Academic records | Registrar `AcademicRecord` |
| Fee templates and fee types | Finance |
| Assessment, discounts, financial aid | Finance `StudentAssessment` |
| Payments and receipt/reference numbers | Finance `Payment` |
| Official finance clearance | Finance `StudentAssessment.financeStatus` per academic year |
| Registrar visible finance status | Active-year mirror in `Student.financeStatus` |

## Shared Keys

Every integration read or write must include:

- `studentId`
- `academicYearId`

Finance records must never be joined by student alone without academic year scope.

## Authentication and Authorization

All endpoints require a JWT bearer token.

| Role | Access |
| --- | --- |
| `FINANCE` | Read learner summaries, read finance profiles, post finance data, sync active-year finance status |
| `REGISTRAR` | Read finance profile and clearance data only |
| `ADMIN` | Allowed by global admin override |

## Endpoints

### Get Student Finance Profile

`GET /integration/students/:studentId/finance-profile?academicYearId=:academicYearId`

Roles:

- `REGISTRAR`
- `FINANCE`
- `ADMIN`

Returns:

- registrar student summary
- selected academic year
- academic records for the academic year
- finance assessment
- assessment line items
- payments
- clearance status

Errors:

- `400` if `academicYearId` is missing
- `404` if student is missing

### Get Finance Clearance List

`GET /integration/finance/clearance?academicYearId=:academicYearId`

Roles:

- `REGISTRAR`
- `FINANCE`
- `ADMIN`

Returns one row per assessed student in the academic year:

- student summary
- finance status
- net amount
- paid amount
- balance
- last update timestamp

### Sync Student Finance Status

`POST /integration/finance/sync-student/:studentId?academicYearId=:academicYearId`

Roles:

- `FINANCE`
- `ADMIN`

Behavior:

- Reads `StudentAssessment.financeStatus` for the student and academic year.
- If the academic year is active, mirrors that value to `Student.financeStatus`.
- If the academic year is not active, no mirror update is made.
- Writes an integration log record.

Errors:

- `400` if `academicYearId` is missing
- `404` if assessment is missing

### Get Data Map

`GET /integration/data-map`

Roles:

- `REGISTRAR`
- `FINANCE`
- `ADMIN`

Returns machine-readable field mapping and role notes.

## Data Mapping

| Registrar Field | Finance Field | Notes |
| --- | --- | --- |
| `Student.id` | `StudentAssessment.studentId`, `Payment.studentId` | Primary learner link |
| `Student.academicYearId` | `StudentAssessment.academicYearId`, `Payment.academicYearId` | Required academic-year boundary |
| `Student.gradeLevel` | `FeeTemplate.gradeLevel` | Used to select template |
| `Student.financeStatus` | Active-year mirror of `StudentAssessment.financeStatus` | Visibility only |
| `AcademicRecord.academicYearId` | Integration profile academic-year filter | Read-only finance context |
| `StudentAssessment.financeStatus` | Registrar clearance visibility | Official finance clearance |
| `Payment.amount` | Ledger visibility | Finance-owned |
| `Payment.receiptNumber` | Ledger visibility | Finance-owned, editable with audit |

## Logging

Integration calls write `IntegrationLog` records with:

- action
- source module
- target module
- studentId
- academicYearId
- status
- message
- performedById
- timestamp

The log is used for support, auditing, and tracing sync behavior.

## Privacy and Integrity Rules

- Registrar users can read finance clearance but cannot post or edit payments.
- Finance users can read learner summaries needed for billing but cannot edit registrar academic records.
- Payments and assessments are never mixed across academic years.
- Manual receipt edits remain finance-owned and are audited separately in `PaymentReceiptAudit`.
