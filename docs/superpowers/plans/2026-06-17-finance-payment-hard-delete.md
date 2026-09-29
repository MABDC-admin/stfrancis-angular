# Finance Payment Hard Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow finance users to hard-delete payments from both Finance Payments and Student Ledger, with immediate academic-year-safe recomputation of assessment totals and learner finance clearance, then apply the change to the VPS first.

**Architecture:** Add a single backend delete endpoint in the finance module that owns payment deletion and recomputation. Extend the Angular finance API client and wire compact delete actions into both finance payment-history surfaces so both pages reuse the same backend behavior and refresh from server truth after deletion.

**Tech Stack:** Angular 20 standalone components, NestJS 11, Drizzle ORM, Jest, Node built-in test runner, VPS Docker deployment.

---

## File Structure

- Modify: `sms-nestjs-backend/src/finance/finance.controller.ts`
  - Expose `DELETE /finance/payments/:id` for finance role.
- Modify: `sms-nestjs-backend/src/finance/finance.service.ts`
  - Add the single owner method for hard delete + recomputation.
- Modify: `sms-nestjs-backend/src/finance/finance.service.spec.ts`
  - Add backend regression tests first.
- Modify: `sms-angular-dashboard-starter/src/app/core/services/finance-api.service.ts`
  - Add client delete method.
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/payments/payments.component.ts`
  - Add delete action handler and reload behavior.
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/payments/payments.component.html`
  - Add delete button in payment history.
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/student-ledger/student-ledger.component.ts`
  - Add delete action handler and ledger refresh behavior.
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/student-ledger/student-ledger.component.html`
  - Add delete button in payment history.
- Modify or create: `sms-angular-dashboard-starter/src/app/pages/finance/payments/payments.component.ui.spec.ts`
  - Add UI regression for delete affordance.
- Modify or create: `sms-angular-dashboard-starter/src/app/pages/finance/student-ledger/student-ledger.component.ui.spec.ts`
  - Add UI regression for delete affordance.

### Task 1: Backend Delete Contract

**Files:**
- Modify: `sms-nestjs-backend/src/finance/finance.service.spec.ts`
- Modify: `sms-nestjs-backend/src/finance/finance.service.ts`
- Modify: `sms-nestjs-backend/src/finance/finance.controller.ts`

- [ ] **Step 1: Write the failing backend tests**

Add these tests near the existing payment rules in `sms-nestjs-backend/src/finance/finance.service.spec.ts`:

```ts
  it('hard deletes a payment and recomputes assessment totals', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 'payment-1',
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      amount: 400,
      receiptNumber: 'OR-001',
    });
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 1000,
      balance: 0,
      financeStatus: 'Cleared',
    });
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({ id: 'ay-1', isActive: true });
    db.__queue.push('delete', {
      id: 'payment-1',
      studentAssessmentId: 'assessment-1',
    });
    db.__queue.push('select', [{ amount: 600 }]);
    db.__queue.push('update', {
      id: 'assessment-1',
      paidAmount: 600,
      balance: 400,
      financeStatus: 'With Balance',
    });
    db.__queue.push('update', {
      id: 'student-1',
      financeStatus: 'With Balance',
    });

    const result = await service.deletePayment('payment-1');

    expect(result.deletedPayment.id).toBe('payment-1');
    expect(result.assessment.paidAmount).toBe(600);
    expect(result.assessment.balance).toBe(400);
    expect(result.assessment.financeStatus).toBe('With Balance');
  });

  it('returns learner to full balance when deleting the only payment', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 'payment-2',
      studentAssessmentId: 'assessment-2',
      studentId: 'student-2',
      academicYearId: 'ay-1',
      amount: 1000,
      receiptNumber: 'OR-002',
    });
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-2',
      studentId: 'student-2',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 1000,
      balance: 0,
      financeStatus: 'Cleared',
    });
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({ id: 'ay-1', isActive: false });
    db.__queue.push('delete', { id: 'payment-2' });
    db.__queue.push('select', []);
    db.__queue.push('update', {
      id: 'assessment-2',
      paidAmount: 0,
      balance: 1000,
      financeStatus: 'With Balance',
    });

    const result = await service.deletePayment('payment-2');

    expect(result.assessment.paidAmount).toBe(0);
    expect(result.assessment.balance).toBe(1000);
    expect(result.assessment.financeStatus).toBe('With Balance');
  });

  it('rejects deleting a payment whose assessment is missing', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 'payment-3',
      studentAssessmentId: 'assessment-missing',
      studentId: 'student-3',
      academicYearId: 'ay-1',
      amount: 300,
    });
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.deletePayment('payment-3')).rejects.toThrow('Student assessment was not found.');
  });

  it('rejects cross-year mismatches on delete', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 'payment-4',
      studentAssessmentId: 'assessment-4',
      studentId: 'student-4',
      academicYearId: 'ay-1',
      amount: 300,
    });
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-4',
      studentId: 'student-4',
      academicYearId: 'ay-2',
      netAmount: 800,
      paidAmount: 300,
      balance: 500,
      financeStatus: 'With Balance',
    });

    await expect(service.deletePayment('payment-4')).rejects.toThrow(
      'Payment academic year must match assessment academic year.',
    );
  });
```

- [ ] **Step 2: Run backend tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/finance/finance.service.spec.ts
```

Expected: FAIL because `deletePayment` does not exist yet.

- [ ] **Step 3: Implement minimal backend delete logic**

Add this method to `sms-nestjs-backend/src/finance/finance.service.ts` near `recordPayment` and `updatePaymentReceipt`:

```ts
  async deletePayment(paymentId: string) {
    const payment = await this.drizzle.db.query.payment.findFirst({
      where: eq(schema.payment.id, paymentId),
    });
    if (!payment) {
      throw new NotFoundException('Payment was not found.');
    }

    const assessment = await this.drizzle.db.query.studentAssessment.findFirst({
      where: eq(schema.studentAssessment.id, payment.studentAssessmentId),
    });
    if (!assessment) {
      throw new NotFoundException('Student assessment was not found.');
    }
    if (payment.academicYearId !== assessment.academicYearId) {
      throw new BadRequestException(
        'Payment academic year must match assessment academic year.',
      );
    }

    const [deletedPayment] = await this.drizzle.db
      .delete(schema.payment)
      .where(eq(schema.payment.id, paymentId))
      .returning();

    const remainingPayments = await this.drizzle.db
      .select({ amount: schema.payment.amount })
      .from(schema.payment)
      .where(
        and(
          eq(schema.payment.studentAssessmentId, assessment.id),
          eq(schema.payment.academicYearId, assessment.academicYearId),
        ),
      );

    const paidAmount = remainingPayments.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const balance = Number(assessment.netAmount) - paidAmount;
    const financeStatus = balance === 0 ? 'Cleared' : 'With Balance';

    const [updatedAssessment] = await this.drizzle.db
      .update(schema.studentAssessment)
      .set({
        paidAmount,
        balance,
        financeStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.studentAssessment.id, assessment.id))
      .returning();

    const academicYear = await this.drizzle.db.query.academicYear.findFirst({
      where: eq(schema.academicYear.id, payment.academicYearId),
    });
    if (academicYear?.isActive) {
      await this.drizzle.db
        .update(schema.student)
        .set({ financeStatus: updatedAssessment.financeStatus })
        .where(eq(schema.student.id, payment.studentId));
    }

    return {
      deletedPayment,
      assessment: updatedAssessment,
    };
  }
```

Expose it in `sms-nestjs-backend/src/finance/finance.controller.ts`:

```ts
  @Delete('payments/:id')
  @Roles('FINANCE')
  deletePayment(@Param('id') id: string) {
    return this.financeService.deletePayment(id);
  }
```

- [ ] **Step 4: Run backend tests to verify they pass**

Run:

```bash
npm test -- --runInBand src/finance/finance.service.spec.ts
```

Expected: PASS for the new delete-payment scenarios and existing finance rules.

- [ ] **Step 5: Run backend build**

Run:

```bash
npm run build
```

Expected: Nest build succeeds with no TypeScript errors.

### Task 2: Finance API Client

**Files:**
- Modify: `sms-angular-dashboard-starter/src/app/core/services/finance-api.service.ts`

- [ ] **Step 1: Write the failing client-facing expectations in UI specs**

Add API call expectations in the frontend specs used by Tasks 3 and 4 so they reference:

```ts
finance.deletePayment(payment.id)
```

and verify the pages reload their data after success.

- [ ] **Step 2: Run the relevant frontend specs to verify failure**

Run:

```bash
node --test src/app/pages/finance/payments/payments.component.ui.spec.ts
node --test src/app/pages/finance/student-ledger/student-ledger.component.ui.spec.ts
```

Expected: FAIL because `deletePayment` is missing and the UI does not expose delete behavior yet.

- [ ] **Step 3: Add the minimal API client method**

In `sms-angular-dashboard-starter/src/app/core/services/finance-api.service.ts`, add:

```ts
  deletePayment(id: string): Observable<{
    deletedPayment: Payment;
    assessment: StudentAssessment;
  }> {
    return this.http.delete<{
      deletedPayment: Payment;
      assessment: StudentAssessment;
    }>(`${this.baseUrl}/payments/${id}`);
  }
```

- [ ] **Step 4: Re-run the targeted frontend specs**

Run:

```bash
node --test src/app/pages/finance/payments/payments.component.ui.spec.ts
node --test src/app/pages/finance/student-ledger/student-ledger.component.ui.spec.ts
```

Expected: they still fail, but now only because the UI is not wired yet.

### Task 3: Finance Payments Screen

**Files:**
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/payments/payments.component.ts`
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/payments/payments.component.html`
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/payments/payments.component.ui.spec.ts`

- [ ] **Step 1: Write the failing Payments UI regression**

Add a simple static/UI regression to `payments.component.ui.spec.ts` that checks for:

```ts
assert.match(template, /Delete/);
assert.match(component, /deletePayment\(payment: Payment\)/);
assert.match(component, /this\.finance\.deletePayment\(payment\.id\)/);
assert.match(component, /this\.loadAssessments\(\)/);
```

If the spec is AST-style already, keep the same style and assert equivalent behavior.

- [ ] **Step 2: Run the Payments UI spec to verify it fails**

Run:

```bash
node --test src/app/pages/finance/payments/payments.component.ui.spec.ts
```

Expected: FAIL because delete affordance and handler do not exist yet.

- [ ] **Step 3: Add minimal delete handler to Payments component**

In `payments.component.ts`, add:

```ts
  deletePayment(payment: Payment) {
    this.message = '';
    this.error = '';
    const confirmed = window.confirm(
      `Delete payment ${payment.receiptNumber} for ${payment.student?.lastName || 'this learner'}?`,
    );
    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.finance.deletePayment(payment.id).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Payment deleted and finance clearance updated.';
        this.loadAssessments();
      },
      error: (err) => this.fail(err),
    });
  }
```

Add the table header/action cell in `payments.component.html`:

```html
<thead>
  <tr>
    <th>Student</th>
    <th>Date</th>
    <th>Receipt / Reference</th>
    <th>Method</th>
    <th>Payee / Remarks</th>
    <th>Amount</th>
    <th>Actions</th>
  </tr>
</thead>
```

```html
<td class="actions-cell">
  <button class="danger-btn" type="button" (click)="deletePayment(payment)" [disabled]="loading">
    Delete
  </button>
</td>
```

Update the empty-state row colspan from `6` to `7`.

- [ ] **Step 4: Run the Payments UI spec to verify it passes**

Run:

```bash
node --test src/app/pages/finance/payments/payments.component.ui.spec.ts
```

Expected: PASS.

### Task 4: Student Ledger Screen

**Files:**
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/student-ledger/student-ledger.component.ts`
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/student-ledger/student-ledger.component.html`
- Modify: `sms-angular-dashboard-starter/src/app/pages/finance/student-ledger/student-ledger.component.ui.spec.ts`

- [ ] **Step 1: Write the failing Student Ledger UI regression**

Add a regression that checks for:

```ts
assert.match(template, /Delete/);
assert.match(component, /deletePayment\(payment: Payment\)/);
assert.match(component, /this\.finance\.deletePayment\(payment\.id\)/);
assert.match(component, /this\.loadLedger\(/);
```

- [ ] **Step 2: Run the Student Ledger UI spec to verify it fails**

Run:

```bash
node --test src/app/pages/finance/student-ledger/student-ledger.component.ui.spec.ts
```

Expected: FAIL because delete behavior is not present.

- [ ] **Step 3: Add minimal delete handler to Student Ledger**

In `student-ledger.component.ts`, add a handler that confirms, deletes, and reloads the selected learner ledger:

```ts
  deletePayment(payment: Payment) {
    this.message = '';
    this.error = '';
    if (!this.selectedStudentId) {
      this.error = 'Select a learner first.';
      return;
    }
    const confirmed = window.confirm(
      `Delete payment ${payment.receiptNumber} from this ledger?`,
    );
    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.finance.deletePayment(payment.id).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Payment deleted and ledger updated.';
        this.loadLedger(this.selectedStudentId);
      },
      error: (err) => this.fail(err),
    });
  }
```

In `student-ledger.component.html`, add an Actions column to the payment history table and a delete button per payment row. Update the empty-state colspan to match.

- [ ] **Step 4: Run the Student Ledger UI spec to verify it passes**

Run:

```bash
node --test src/app/pages/finance/student-ledger/student-ledger.component.ui.spec.ts
```

Expected: PASS.

### Task 5: Integrated Verification

**Files:**
- No new code files

- [ ] **Step 1: Run focused backend tests**

Run:

```bash
npm test -- --runInBand src/finance/finance.service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused frontend UI regressions**

Run:

```bash
node --test src/app/pages/finance/payments/payments.component.ui.spec.ts
node --test src/app/pages/finance/student-ledger/student-ledger.component.ui.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run full frontend build**

Run:

```bash
npm run build
```

Expected: Angular build succeeds.

- [ ] **Step 4: Run full backend build**

Run:

```bash
npm run build
```

Expected: Nest build succeeds.

### Task 6: VPS-First Apply

**Files:**
- Existing deployment/runtime config only if needed

- [ ] **Step 1: Check VPS app state before deploy**

Run:

```bash
ssh root@91.98.20.229
docker ps
```

Expected: identify the running frontend/backend containers or compose project.

- [ ] **Step 2: Sync only the updated project files to VPS**

Run:

```bash
git status --short
```

Then deploy using the existing VPS workflow already used in this repo, keeping changes limited to:

```text
sms-nestjs-backend/src/finance/*
sms-angular-dashboard-starter/src/app/core/services/finance-api.service.ts
sms-angular-dashboard-starter/src/app/pages/finance/payments/*
sms-angular-dashboard-starter/src/app/pages/finance/student-ledger/*
```

- [ ] **Step 3: Rebuild and restart backend/frontend on VPS**

Run the existing VPS compose/build commands used by this project. If the stack is compose-based, use:

```bash
docker compose -f docker-compose.vps.yml build
docker compose -f docker-compose.vps.yml up -d
```

Expected: containers restart cleanly and stay healthy.

- [ ] **Step 4: Verify live payment deletion from both screens**

Use the browser against the VPS URL and verify:

```text
1. Finance > Payments shows a Delete action.
2. Deleting a payment removes it from the table.
3. Related learner balance and finance clearance update immediately.
4. Finance > Student Ledger shows the same Delete action.
5. Deleting from Student Ledger updates the ledger totals immediately.
```

- [ ] **Step 5: Record the rollout evidence**

Capture:

```text
- test command results
- build results
- VPS container status
- live verification result from both finance surfaces
```

## Self-Review

- Spec coverage: backend endpoint, recomputation, active-year mirror, both UI surfaces, local verification, and VPS-first rollout are all covered.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: `deletePayment(id: string)` is the same method name across backend, client, and UI handlers; returned object uses `deletedPayment` and `assessment` consistently.
