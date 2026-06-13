# Finance Portal Design

Date: 2026-06-11

## Scope

Build the first production-ready finance portal slice for the school management system. The module covers fee setup, student assessment, payment recording, student ledger viewing, and automatic finance clearance updates.

The critical invariant is academic-year segregation. Every fee template, assessment, payment, ledger query, and clearance update must be tied to one `academicYearId`. Current, previous, and future school-year finance records must never contaminate each other.

## Approved Decisions

- Version 1 allows only one active student assessment per student per academic year.
- Fee setup records can be managed by Admin and Finance users.
- Finance can delete unused fee setup records.
- Fee setup records already used in any assessment or payment cannot be hard deleted; they can only be deactivated.
- Fee templates are available by academic year and grade level.
- Student assessments may be generated from a grade-level template or adjusted for an individual student.
- Discounts are applied per student assessment, not globally on the template.
- Discounts stack, are stored separately for audit, and are capped at 100% total.
- Discount categories are regular discount, sibling discount, and scholarship discount.
- Payment methods are Cash, Bank Transfer, GCash, and Card/POS.
- Cheque is excluded.
- Receipt/reference number is manual and editable.
- Receipt/reference number must be unique within the same academic year.
- Partial payments are allowed.
- Overpayments are blocked.
- A payment amount must be greater than zero and less than or equal to the remaining balance.
- When the balance reaches zero, that academic-year finance clearance becomes Cleared.
- Version 1 does not include receipt/PDF generation. It stores payment records and shows them in the ledger.

## Pages

### Billing & Assessment

This is the primary finance work area.

- Academic year selector is required before loading finance data.
- Student search/list is filtered by academic year enrollment context.
- Assessment panel shows selected template, line items, discounts, gross amount, discount amount, net amount, paid amount, balance, and clearance status.
- Actions include Save Assessment and Record Payment.
- Creating an assessment for a student who already has one in the same academic year opens or updates the existing assessment and never creates a duplicate active assessment.

### Payments

This page records payments against existing assessments.

- User searches/selects a student assessment for one academic year.
- Remaining balance is displayed before amount entry.
- Receipt/reference number is manually entered and editable.
- Allowed methods are Cash, Bank Transfer, GCash, and Card/POS.
- Amount validation blocks zero, negative, and over-balance payments.
- Saving a payment recalculates paid amount, balance, and clearance for the same academic year.

### Student Ledger

This page provides the audit view for one student in one academic year.

- Shows assessment line items.
- Shows regular, sibling, and scholarship discounts separately.
- Shows payment history.
- Shows net amount, paid amount, balance, and clearance status.
- Does not mix records from other academic years.

### Finance Setup

This page manages reusable billing setup.

- Fee Types CRUD.
- Fee Templates CRUD by academic year and grade level.
- Unused fee types/templates may be deleted.
- Used fee types/templates may only be deactivated.
- Deactivated records are hidden from future setup use but remain visible in historical ledgers and assessments.

## Data Model

### FeeType

Represents a reusable billable category such as Tuition, Books, Uniform, Miscellaneous, or Registration. Fee types are a global setup catalog; academic-year segregation is enforced when fee types are used inside fee templates, assessment line items, and payments.

Fields:

- `id`
- `name`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

### FeeTemplate

Represents a reusable assessment template for one academic year and grade level.

Fields:

- `id`
- `academicYearId`
- `gradeLevel`
- `name`
- `isActive`
- `createdAt`
- `updatedAt`

### FeeTemplateLineItem

Represents one fee line inside a template.

Fields:

- `id`
- `feeTemplateId`
- `feeTypeId`
- `description`
- `amount`
- `sortOrder`

### StudentAssessment

Represents the single active finance assessment for one student in one academic year.

Fields:

- `id`
- `studentId`
- `academicYearId`
- `feeTemplateId`
- `regularDiscountPercent`
- `siblingDiscountPercent`
- `scholarshipDiscountPercent`
- `grossAmount`
- `discountAmount`
- `netAmount`
- `paidAmount`
- `balance`
- `financeStatus`
- `createdById`
- `updatedById`
- `createdAt`
- `updatedAt`

Constraints:

- Unique active assessment per `studentId` plus `academicYearId`.
- Discount percentage sum must not exceed 100%.
- Money fields must not be negative.

### StudentAssessmentLineItem

Stores the assessment line items copied from the template at the time of assessment.

Fields:

- `id`
- `studentAssessmentId`
- `feeTypeId`
- `description`
- `amount`
- `sourceFeeTemplateLineItemId`

This snapshot is required so historical assessment totals do not change if templates are edited later.

### Payment

Represents a posted payment against one student assessment.

Fields:

- `id`
- `studentAssessmentId`
- `studentId`
- `academicYearId`
- `receiptNumber`
- `method`
- `amount`
- `paymentDate`
- `remarks`
- `encodedById`
- `createdAt`
- `updatedAt`

Constraints:

- Payment `academicYearId` must match the assessment `academicYearId`.
- Payment `studentId` must match the assessment `studentId`.
- Receipt/reference number is unique within the same academic year.
- Amount must be greater than zero and less than or equal to current assessment balance.

### PaymentReceiptAudit

Tracks edits to manual receipt/reference numbers.

Fields:

- `id`
- `paymentId`
- `oldReceiptNumber`
- `newReceiptNumber`
- `editedById`
- `editedAt`

## Backend APIs

### Fee Types

- `GET /finance/fee-types`
- `POST /finance/fee-types`
- `PATCH /finance/fee-types/:id`
- `DELETE /finance/fee-types/:id`
- `PATCH /finance/fee-types/:id/deactivate`

Delete behavior:

- If unused, delete.
- If used, return a clear conflict response recommending deactivation.

### Fee Templates

- `GET /finance/fee-templates?academicYearId=...`
- `POST /finance/fee-templates`
- `GET /finance/fee-templates/:id`
- `PATCH /finance/fee-templates/:id`
- `DELETE /finance/fee-templates/:id`
- `PATCH /finance/fee-templates/:id/deactivate`

All list operations require an academic year filter.

### Student Assessments

- `GET /finance/assessments?academicYearId=...`
- `GET /finance/assessments/student/:studentId?academicYearId=...`
- `POST /finance/assessments`
- `PATCH /finance/assessments/:id`

Create/update behavior:

- If an assessment already exists for the student and academic year, return or update the existing assessment instead of creating another active assessment.
- Recalculate gross, discount, net, paid, balance, and status on every assessment update.

### Payments

- `GET /finance/payments?academicYearId=...`
- `POST /finance/payments`
- `PATCH /finance/payments/:id/receipt`

Payment create behavior:

- Validate assessment exists.
- Validate same academic year and student.
- Validate amount does not exceed remaining balance.
- Create payment.
- Recalculate assessment paid amount and balance.
- Update same-academic-year finance clearance status.

### Student Ledger

- `GET /finance/ledger/student/:studentId?academicYearId=...`

Ledger response includes:

- Academic year.
- Student summary.
- Assessment summary.
- Assessment line items.
- Discount breakdown.
- Payment history.
- Current balance.
- Clearance status.

## Authorization

- Admin can access all finance setup and finance transaction operations.
- Finance can manage fee setup, assessments, payments, and ledgers.
- Registrar may read finance clearance status where needed for registrar workflows, but cannot manage finance setup or post payments.

## Error Handling

The backend returns explicit errors for production support:

- Missing `academicYearId`.
- Attempted cross-academic-year payment.
- Attempted duplicate assessment for the same student and academic year.
- Discount total above 100%.
- Payment amount above remaining balance.
- Duplicate receipt/reference number within the same academic year.
- Delete attempted on fee setup already used in historical records.

The frontend shows the exact business reason returned by the backend instead of a generic failure when the backend provides a business-rule error.

## Testing Strategy

Use test-driven development. Backend tests come before implementation.

Required backend tests:

- Creating a second active assessment for the same student and academic year is blocked or resolves to the existing assessment.
- The same student can have separate assessments in different academic years.
- Payment cannot be recorded without `academicYearId`.
- Payment academic year must match the assessment academic year.
- Overpayment is blocked.
- Partial payment is accepted and keeps status With Balance.
- Exact final payment is accepted and sets status Cleared.
- Discount categories stack and cap at 100%.
- Duplicate receipt/reference number is blocked within one academic year.
- Same receipt/reference number is allowed in a different academic year because uniqueness is scoped to `academicYearId`.
- Used fee type/template cannot be hard deleted.
- Used fee type/template can be deactivated.

Required frontend checks:

- Finance menu reaches Billing & Assessment, Payments, Student Ledger, and Finance Setup.
- Billing & Assessment requires/selects academic year.
- Record Payment shows exact remaining balance.
- Overpayment cannot be submitted.
- Successful payment updates balance and clearance status without mixing academic years.

## Implementation Boundary

This spec covers the first finance portal implementation. It intentionally excludes:

- Receipt/PDF generation.
- Online payment gateway integrations.
- Refunds.
- General ledger accounting integration.
- Multi-assessment billing cycles within one academic year.
- Automated scholarship eligibility calculation.

These can be added after the academic-year-safe finance core is stable.
