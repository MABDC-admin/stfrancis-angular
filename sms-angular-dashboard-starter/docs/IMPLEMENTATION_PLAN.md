# Registrar Implementation Plan

## Completed UI scaffolding

The Registrar module has been scaffolded as a UI-first Angular implementation using standalone components, mock data, and route-based navigation.

## Registrar pages included

1. Student Registration
2. Enrollment Applications
3. Student Masterlist
4. Learner Profile
5. Document Verification
6. Section Assignment
7. Academic Records
8. Learner Movement
9. Document Requests
10. DepEd Forms
11. ID / QR Management
12. Registrar Reports

## Data ownership design

Registrar owns:

- Student profile
- Enrollment status
- Section assignment
- Learner movement
- Academic record metadata
- Document verification
- Registrar document requests
- DepEd form preparation
- ID / QR readiness

Finance owns:

- Fee setup
- Assessment
- Payments
- Receipts
- Student ledger
- Statement of account
- Finance clearance

Registrar can view Finance Clearance, but should not edit payment records.

## Backend integration later

Recommended backend pairing remains:

- NestJS
- PostgreSQL
- Prisma
- Redis
- MinIO / S3-compatible storage

## Suggested API groups later

```text
GET /students
POST /students
GET /students/:id
PATCH /students/:id

GET /enrollments
POST /enrollments
PATCH /enrollments/:id/status

GET /student-documents
POST /student-documents
PATCH /student-documents/:id/verify

GET /sections
POST /sections
PATCH /sections/:id/assign-student

GET /academic-records
POST /academic-records/import
PATCH /academic-records/:id/validate

GET /learner-movements
POST /learner-movements
PATCH /learner-movements/:id/approve

GET /document-requests
POST /document-requests
PATCH /document-requests/:id/status

GET /deped-forms
POST /deped-forms/generate

GET /id-qr
POST /id-qr/generate
POST /id-qr/print
```
