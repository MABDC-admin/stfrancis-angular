# School MS — Angular Registrar + Finance Starter

This starter is a UI-first Angular 20 prototype for a School Management System focused on the Registrar and Finance foundation.

## Stack

- Angular standalone components
- Angular Router
- Tailwind CSS
- Material Icons font
- Mock data only for the current batch

## Run

```bash
npm install
npm run start
```

Open:

```text
http://localhost:4200/registrar-finance/dashboard
```

## Current implementation status

### Done in this package

- App shell layout
- Sidebar and topbar
- Registrar + Finance command dashboard
- Dynamic route title/subtitle in the topbar
- Registrar sidebar routes
- Registrar mock data models
- Registrar mock data set
- Student Registration page
- Enrollment Applications page
- Student Masterlist page
- Learner Profile page
- Document Verification page
- Section Assignment page
- Academic Records page
- Learner Movement page
- Document Requests page
- DepEd Forms page
- ID / QR Management page
- Registrar Reports page
- Finance route placeholders

### Not yet implemented

- NestJS backend
- PostgreSQL schema
- Prisma models
- Authentication and RBAC
- Real CRUD actions
- File upload storage
- Receipt / billing / ledger logic
- API integration
- Form validation rules
- Unit tests

## Main Registrar routes

```text
/registrar-finance/student-registration
/registrar-finance/enrollment
/registrar-finance/student-masterlist
/registrar-finance/learner-profile
/registrar-finance/learner-profile/:id
/registrar-finance/documents
/registrar-finance/section-assignment
/registrar-finance/academic-records
/registrar-finance/learner-movement
/registrar-finance/document-requests
/registrar-finance/deped-forms
/registrar-finance/id-qr-management
/registrar-finance/registrar-reports
```

## Suggested next batch

Build Finance UI pages next:

1. Fee Categories
2. Fee Setup
3. Fee Template Builder
4. Installment Plans
5. Student Assessment
6. Payment Collection
7. Official Receipt
8. Student Ledger
9. Statement of Account
10. Finance Reports
