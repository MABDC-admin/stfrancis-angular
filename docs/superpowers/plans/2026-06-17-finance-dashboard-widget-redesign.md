# Finance Dashboard Widget Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/finance/dashboard` widget surface to match the approved reference layout while preserving the current SFXSAI finance shell and avoiding any invented due-date or aging logic.

**Architecture:** Keep the current `DashboardComponent` route and finance shell, but replace the finance widget area with a new two-row composition driven by a richer `FinanceDashboardModel`. Expand the existing finance dashboard utility to prepare view-ready data, then update the dashboard template and stylesheet to render the new composite cards with stable empty states and real finance data.

**Tech Stack:** Angular standalone components, TypeScript, SCSS, Node built-in test runner, Angular build

---

## File Structure

- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.ts`
  - Expand the finance dashboard view model with composite widget fields required by the new layout.
- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.spec.ts`
  - Lock the new utility output with focused data-shaping assertions.
- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.html`
  - Replace the current finance widget grid markup with the approved two-row composition.
- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.scss`
  - Add the exact dashboard card layout, density, chart framing, CTA rows, and responsive behavior for the redesigned finance widgets.
- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.ui.spec.ts`
  - Lock the presence and absence of finance dashboard widget labels and prohibited due-date/aging language.

### Task 1: Expand Finance Dashboard View Model

**Files:**
- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.ts`
- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.spec.ts`

- [ ] **Step 1: Write the failing utility test**

Add assertions to `sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.spec.ts` for the new composite dashboard fields:

```ts
assert.equal(dashboard.totalRevenueCard.helper, 'SY2026-2027 collections posted');
assert.equal(dashboard.totalAssessedCard.assessmentCount, 2);
assert.equal(dashboard.receivablesCard.openAccountsCount, 1);
assert.equal(dashboard.receivablesCard.summaryRows[0].label, 'Collected Total');
assert.equal(dashboard.receivablesCard.summaryRows[1].label, 'Pending Total');
assert.equal(dashboard.receivablesCard.summaryRows[2].label, 'Total Open Balance');
assert.equal(dashboard.receivablesCard.learners.length, 1);
assert.equal(dashboard.alertRows.length > 0, true);
assert.equal(dashboard.birthdayCardCtaLabel, 'Open Account');
assert.equal(
  dashboard.receivablesCard.summaryRows.some((row) => /due|overdue|31-60|61-90|90\\+/.test(row.label.toLowerCase())),
  false,
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test "src/app/pages/dashboard/finance-dashboard.util.spec.ts"`

Expected: FAIL with missing `totalRevenueCard`, `receivablesCard`, `alertRows`, or similar property errors because the view model has not been expanded yet.

- [ ] **Step 3: Write minimal utility implementation**

Update `sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.ts` so the dashboard model exposes view-ready composite fields.

Implementation shape:

```ts
export interface FinanceDashboardSummaryRow {
  label: string;
  value: number;
}

export interface FinanceDashboardLearnerChip {
  learnerName: string;
  initials: string;
  gradeLevel: string;
  balance: number;
}

export interface FinanceDashboardModel {
  academicYearCode: string;
  totalAssessed: number;
  totalRevenue: number;
  accountsReceivable: number;
  collectionRate: number;
  paidStudents: number;
  unpaidStudents: number;
  totalRevenueCard: { helper: string };
  totalAssessedCard: { helper: string; assessmentCount: number };
  receivablesCard: {
    openAccountsCount: number;
    summaryRows: FinanceDashboardSummaryRow[];
    learners: FinanceDashboardLearnerChip[];
  };
  alertRows: Array<{
    title: string;
    description: string;
    tone: 'danger' | 'warning' | 'neutral';
    actionLabel: 'Review Accounts' | 'View Records';
  }>;
  forecast: {
    label: string;
    value: number;
    points: FinanceChartPoint[];
    comparisonText: string;
  };
  birthdayCardCtaLabel: string;
}
```

Build the values from existing `assessments` and `payments` only:

```ts
const openAssessments = assessments.filter((assessment) => Number(assessment.balance || 0) > 0);

const learners = openAssessments.slice(0, 3).map((assessment) => ({
  learnerName: assessment.student
    ? `${assessment.student.lastName}, ${assessment.student.firstName}`
    : 'Learner',
  initials: assessment.student
    ? `${assessment.student.firstName?.[0] || ''}${assessment.student.lastName?.[0] || ''}`.toUpperCase()
    : 'L',
  gradeLevel: assessment.student?.gradeLevel || '',
  balance: Number(assessment.balance || 0),
}));

const summaryRows = [
  { label: 'Collected Total', value: totalRevenue },
  { label: 'Pending Total', value: accountsReceivable },
  { label: 'Total Open Balance', value: accountsReceivable },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test "src/app/pages/dashboard/finance-dashboard.util.spec.ts"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.ts sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.spec.ts
git commit -m "feat: expand finance dashboard widget view model"
```

### Task 2: Replace Finance Dashboard Markup With Approved Two-Row Layout

**Files:**
- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.html`
- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.ui.spec.ts`

- [ ] **Step 1: Write the failing UI spec**

Extend `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.ui.spec.ts` with assertions for the approved widget surface:

```ts
assert.match(template, /Accounts Receivable & Collection Status/, 'Finance dashboard should render the large receivables composite card');
assert.match(template, /Financial Alerts \\/ Reminders/, 'Finance dashboard should render the redesigned alerts widget');
assert.match(template, /Upcoming Learner Birthdays/, 'Finance dashboard should render the birthday widget title that matches the approved design');
assert.match(template, /Review Open Accounts/, 'Receivables card should expose the review CTA');
assert.match(template, /Open Account/, 'Birthday rows should expose the finance account CTA');

for (const forbidden of ['Due Date', 'Overdue', '31-60', '61-90', '>90 days']) {
  assert.equal(template.includes(forbidden), false, `${forbidden} must not appear in the finance dashboard`);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test "src/app/pages/dashboard/dashboard.component.ui.spec.ts"`

Expected: FAIL because the current template still uses the older finance widget wording and structure.

- [ ] **Step 3: Write minimal template implementation**

Replace only the finance widget block in `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.html`.

Use a structure like:

```html
<div class="finance-overview-grid mt-4">
  <article class="finance-card finance-card--revenue">
    <div class="finance-card__head">
      <span>Total Revenue</span>
      <span class="material-icons">payments</span>
    </div>
    <strong>{{ formatPeso(finance.totalRevenue) }}</strong>
    <p>{{ finance.totalRevenueCard.helper }}</p>
  </article>

  <article class="finance-card finance-card--assessed">
    <div class="finance-card__head">
      <span>Total Assessed</span>
      <span class="material-icons">fact_check</span>
    </div>
    <strong>{{ formatPeso(finance.totalAssessed) }}</strong>
    <p>{{ finance.totalAssessedCard.helper }}</p>
    <small>Total counts of assessments: {{ finance.totalAssessedCard.assessmentCount }}</small>
  </article>

  <article class="finance-card finance-card--receivables">
    <div class="finance-card__head">
      <span>Accounts Receivable &amp; Collection Status</span>
      <span class="material-icons">school</span>
    </div>
    <div class="finance-receivable-layout">
      <!-- left amount block -->
      <!-- center donut -->
      <!-- right legend -->
    </div>
    <button routerLink="../billing-summary" class="finance-inline-cta">Review Open Accounts</button>
  </article>

  <article class="finance-card finance-card--alerts">
    <div class="finance-card__head">
      <span>Financial Alerts / Reminders</span>
      <span class="material-icons">notifications_active</span>
    </div>
    <div class="finance-alert-row" *ngFor="let alert of finance.alertRows">
      <button routerLink="../billing-summary">{{ alert.actionLabel }}</button>
    </div>
  </article>

  <article class="finance-card finance-card--forecast">
    <div class="finance-card__head">
      <span>Trends &amp; Forecasts</span>
      <span class="material-icons">trending_up</span>
    </div>
    <strong>{{ formatPeso(finance.forecast.value) }}</strong>
    <p>{{ finance.forecast.label }}</p>
    <span class="finance-trend-badge">{{ finance.forecast.comparisonText }}</span>
  </article>

  <article class="finance-card finance-card--birthdays">
    <div class="finance-card__head">
      <span>Upcoming Learner Birthdays</span>
      <span class="material-icons">cake</span>
    </div>
    <div class="finance-birthday-row" *ngFor="let birthday of upcomingBirthdays">
      <button routerLink="../student-ledger">Open Account</button>
    </div>
  </article>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test "src/app/pages/dashboard/dashboard.component.ui.spec.ts"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.html sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.ui.spec.ts
git commit -m "feat: rebuild finance dashboard widget markup"
```

### Task 3: Apply Reference-Matched Styling and Stable Empty States

**Files:**
- Modify: `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.scss`
- Test: `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.ui.spec.ts`

- [ ] **Step 1: Write the failing UI structure assertion**

Add a structure-level assertion that guards the new class hooks:

```ts
for (const className of [
  'finance-overview-grid',
  'finance-card--receivables',
  'finance-card--alerts',
  'finance-card--forecast',
  'finance-card--birthdays',
  'finance-trend-badge',
  'finance-inline-cta',
]) {
  assert.equal(template.includes(className), true, `${className} should be present for the redesigned finance dashboard layout`);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test "src/app/pages/dashboard/dashboard.component.ui.spec.ts"`

Expected: FAIL because the CSS hook classes do not yet exist or the template has not been updated with all required selectors.

- [ ] **Step 3: Write minimal styling implementation**

Add a dedicated finance dashboard style block in `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.scss`.

Core shape:

```scss
.finance-overview-grid {
  display: grid;
  grid-template-columns: 1.05fr 1.05fr 1.9fr;
  gap: 1rem;
}

.finance-card {
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  padding: 1rem 1.1rem;
}

.finance-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  font-size: .74rem;
  font-weight: 900;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.finance-card--receivables {
  grid-row: span 1;
}

.finance-card--alerts,
.finance-card--forecast,
.finance-card--birthdays {
  min-height: 280px;
}

.finance-inline-cta {
  border-radius: 10px;
  border: 1px solid #d8e3ee;
  background: #fff;
  padding: .55rem .85rem;
  font-size: .78rem;
  font-weight: 800;
}

.finance-trend-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #eaf7ef;
  color: #117a50;
  padding: .4rem .7rem;
  font-size: .72rem;
  font-weight: 800;
}

@media (max-width: 1180px) {
  .finance-overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .finance-overview-grid {
    grid-template-columns: 1fr;
  }
}
```

Style the alerts and birthdays as stacked rows with dense right-side buttons, matching the approved reference proportions.

- [ ] **Step 4: Run tests and build**

Run:

```bash
node --test "src/app/pages/dashboard/dashboard.component.ui.spec.ts" "src/app/pages/dashboard/finance-dashboard.util.spec.ts"
npm run build
```

Expected:
- both test files PASS
- Angular build completes successfully

- [ ] **Step 5: Commit**

```bash
git add sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.scss sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.html sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.ui.spec.ts sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.ts sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.spec.ts
git commit -m "feat: style finance dashboard widgets to match approved design"
```

### Task 4: Live Verification on Finance Dashboard

**Files:**
- Verify only: `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.html`
- Verify only: `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.scss`

- [ ] **Step 1: Reload the live dashboard**

Run the local frontend if needed, then reload:

```bash
npm start
```

Expected: Angular dev server remains available at `http://127.0.0.1:4200`

- [ ] **Step 2: Verify finance dashboard composition in the browser**

Open `http://127.0.0.1:4200/finance/dashboard` and confirm:

- the shell is unchanged
- top row is `Total Revenue`, `Total Assessed`, large `Accounts Receivable & Collection Status`
- bottom row is `Financial Alerts / Reminders`, `Trends & Forecasts`, `Upcoming Learner Birthdays`
- no due-date or aging bucket text appears
- birthdays and alerts render with dense action-row styling

- [ ] **Step 3: Verify responsive fallback**

Check the same route at a narrower viewport and confirm:

- cards stack cleanly
- no text overlap
- CTA buttons remain readable

- [ ] **Step 4: Final commit**

```bash
git status --short
```

Expected: only intended finance dashboard files are changed before final review or integration.

## Self-Review

- Spec coverage: covered the finance-only scope, preserved shell, defined the exact six-widget composition, banned due dates and aging labels, and kept the work frontend-only.
- Placeholder scan: no `TBD`, no implicit “add validation,” and every task has exact files, commands, and concrete code direction.
- Type consistency: the plan consistently uses `FinanceDashboardModel`, `totalRevenueCard`, `totalAssessedCard`, `receivablesCard`, `alertRows`, `forecast`, and `birthdayCardCtaLabel` across utility, template, and tests.
