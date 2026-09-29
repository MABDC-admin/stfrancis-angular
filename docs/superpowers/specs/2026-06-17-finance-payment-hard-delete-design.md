# Finance Payment Hard Delete Design

Date: 2026-06-17
Project: SMS Angular Registrar/Finance
Scope: Allow finance to hard-delete posted payments from both Finance Payments and Student Ledger, with immediate academic-year-safe recomputation and VPS-first rollout.

## Goal

Finance users need to remove incorrect posted payments. Deletion must be a true hard delete, must be available from both payment review surfaces, and must immediately recalculate the learner finance state for the same academic year.

## Decisions

- Payment deletion is a true hard delete.
- Finance can delete any payment in the selected academic year, not only the latest payment.
- Deletion must immediately recompute:
  - `paidAmount`
  - `balance`
  - `financeStatus`
- Deletion must be available in:
  - `Finance > Payments`
  - `Finance > Student Ledger`
- VPS is the priority target after local verification.

## Constraints

- Academic-year segregation remains strict.
- A deleted payment must only affect the linked assessment in the same academic year.
- Learner `financeStatus` mirror on the student record should only be updated when the affected academic year is active, matching existing payment-posting behavior.
- Only `FINANCE` role can delete payments.

## Backend Design

### New endpoint

- Add `DELETE /finance/payments/:id`

### Service behavior

Add a single backend method that owns all delete logic:

1. Load the payment by id.
2. Fail with `NotFoundException` if missing.
3. Load the linked assessment by `studentAssessmentId`.
4. Fail if the assessment is missing.
5. Fail if the payment academic year does not equal the assessment academic year.
6. Delete the payment row from `payment`.
7. Re-query remaining payments for the same assessment and same academic year.
8. Recompute:
   - `paidAmount = sum(remaining payment.amount)`
   - `balance = netAmount - paidAmount`
   - `financeStatus = balance === 0 ? 'Cleared' : 'With Balance'`
9. Update the assessment with the recomputed values.
10. If the affected academic year is active, mirror the recomputed `financeStatus` to the learner row.
11. Return the deleted payment id plus the updated assessment summary.

### Why one backend owner

The recomputation rule must not be duplicated across multiple frontend pages. A single service method keeps deletion, year-safety, and clearance updates consistent regardless of which screen initiated the action.

## Frontend Design

### Finance API service

- Add `deletePayment(id: string)`

### Payments page

- Add an Actions column to payment history.
- Show a delete action per row.
- Require explicit confirmation before delete.
- After success:
  - show success feedback
  - reload assessments
  - reload payments
  - preserve academic year scope

### Student Ledger page

- Add the same delete action to payment history rows.
- Reuse the same backend endpoint.
- After success:
  - reload the selected learner ledger
  - refresh any visible assessment/payment summaries

### UX rules

- Use the existing finance visual language.
- Delete action should be visually destructive but compact.
- No delete affordance for non-finance roles.
- Error messages should surface backend validation directly where possible.

## Data and Integrity Rules

- Payment deletion affects only the target payment row.
- Assessment totals are derived from remaining payments after delete.
- No cross-academic-year recomputation is allowed.
- Receipt/reference uniqueness remains enforced only for existing payments; once a payment is hard-deleted, its old receipt number can be reused according to the current system rules.

## Testing Strategy

### Backend

Add failing tests first for:

- deleting a payment recomputes `paidAmount`, `balance`, and `financeStatus`
- deleting the final payment returns the assessment to full balance
- deletion mirrors learner finance status when the academic year is active
- deletion rejects missing payment
- deletion rejects missing assessment
- deletion rejects cross-year mismatch between payment and assessment

### Frontend

Add UI/static behavior tests for:

- Payments page exposes delete action in history
- Student Ledger exposes delete action in history
- both surfaces call the finance delete API and refresh data after success

## Rollout

1. Implement and verify locally first.
2. Apply to VPS immediately after local tests/build pass.
3. Restart the backend service on VPS.
4. Verify live on VPS using both:
   - Finance Payments
   - Student Ledger

## Out of Scope

- Soft delete / void workflow
- Delete audit trail table for hard deletes
- Role expansion beyond finance
- Bulk payment deletion
