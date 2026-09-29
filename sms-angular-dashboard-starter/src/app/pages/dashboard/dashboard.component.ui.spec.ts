import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const template = readFileSync(
  join(process.cwd(), 'src/app/pages/dashboard/dashboard.component.html'),
  'utf8',
);
const stylesheet = readFileSync(
  join(process.cwd(), 'src/app/pages/dashboard/dashboard.component.scss'),
  'utf8',
);

const financeSection =
  template.match(/<section class="finance-dashboard-export"[\s\S]*?<\/section>/)?.[0] ?? '';

for (const label of [
  'Expenses Overview',
  'Profit / Loss',
  'Accounts Payable',
  'Top Expense Categories',
  'Budget vs Actual',
  'Money Out',
  'Cash Flow',
  'mini-bars',
  'Registrar Work Queue',
  'Finance Work Queue',
  'Enrollment Progress',
  'Quick Actions',
]) {
  assert.equal(financeSection.includes(label), false, `${label} should not render in the finance dashboard`);
}

assert.equal(financeSection.includes('Birthday'), true, 'Finance dashboard should include incoming learner birthdays');

for (const label of [
  'Accounts Receivable & Collection Status',
  'Financial Alerts / Reminders',
]) {
  assert.equal(financeSection.includes(label), true, `${label} should render in the finance dashboard`);
}

for (const hook of [
  'finance-overview-grid',
  'finance-card--receivables',
  'finance-card--alerts',
  'finance-card--forecast',
  'finance-card--birthdays',
  'finance-trend-badge',
  'finance-inline-cta',
]) {
  assert.equal(financeSection.includes(hook), true, `${hook} should render in the finance dashboard`);
}

assert.match(
  stylesheet,
  /\.finance-overview-grid\s*\{[\s\S]*?align-items:\s*stretch;/,
  'Finance dashboard should define the overview grid container in SCSS',
);

for (const [selector, span] of [
  ['finance-card--metric', 'span 3'],
  ['finance-card--assessed', 'span 3'],
  ['finance-card--receivables', 'span 6'],
  ['finance-card--alerts', 'span 4'],
  ['finance-card--forecast', 'span 4'],
  ['finance-card--birthdays', 'span 4'],
] as const) {
  assert.match(
    stylesheet,
    new RegExp(`\\.${selector}[\\s\\S]*?grid-column:\\s*${span.replace(' ', '\\s*')};`),
    `${selector} should keep its finance grid column contract`,
  );
}

for (const breakpoint of ['1280px', '900px', '760px']) {
  assert.match(
    stylesheet,
    new RegExp(`@media\\s*\\(max-width:\\s*${breakpoint.replace('.', '\\.')}\\)`),
    `Finance dashboard should include the ${breakpoint} responsive breakpoint`,
  );
}

assert.equal(
  /\.alert-list div\s*\{/.test(stylesheet),
  false,
  'Finance alert rows should not be styled with a broad .alert-list div selector',
);
assert.match(
  stylesheet,
  /\.alert-list\s*>\s*div\s*\{/,
  'Finance alert rows should use a direct-child selector',
);

if (financeSection.includes('finance-progress-track')) {
  assert.match(
    stylesheet,
    /\.finance-progress-track\s*\{/,
    'finance-progress-track should have a dedicated stylesheet rule when used in the template',
  );
}

assert.equal(
  /finance-receivables-summary[^"\n]*space-y-2/.test(financeSection),
  false,
  'Finance receivables summary should not mix grid spacing with Tailwind space-y-2',
);

assert.match(
  financeSection,
  /<article class="[^"]*\bfinance-card--birthdays\b[^"]*">[\s\S]*?<span>Upcoming Learner Birthdays<\/span>/,
  'Finance dashboard should render the exact birthdays widget heading',
);

assert.match(
  financeSection,
  /<button[^>]*>[\s\S]*?\bReview Open Accounts\b[\s\S]*?<\/button>/,
  'Finance dashboard should include a review CTA for open accounts',
);

assert.match(
  financeSection,
  /<div \*ngFor="let alert of finance\.alertRows"[\s\S]*?<button[^>]*>[\s\S]*?{{ alert\.actionLabel }}[\s\S]*?<\/button>[\s\S]*?<\/div>/,
  'Finance dashboard should render action buttons for each finance alert row',
);

assert.match(
  financeSection,
  /<div \*ngFor="let birthday of upcomingBirthdays"[\s\S]*?<button[^>]*>[\s\S]*?\bOpen Account\b[\s\S]*?<\/button>[\s\S]*?<\/div>/,
  'Finance dashboard should render the birthday CTA inside each repeated learner row',
);

assert.equal(financeSection.includes('forecast-bars'), false, 'Finance dashboard should not use the placeholder forecast bars');

assert.match(
  financeSection,
  /forecast-line-chart[\s\S]*?<svg[\s\S]*?\*ngFor="let point of finance\.forecast\.points; index as i"[\s\S]*?<\/svg>/,
  'Finance dashboard should render a line-chart-like trends structure driven by forecast points',
);

for (const label of ['Due Date', 'Overdue', '31-60', '61-90', '>90 days']) {
  assert.equal(financeSection.includes(label), false, `${label} should not render in the finance dashboard`);
}

assert.match(
  template,
  /<button[^>]*\*ngIf="role === 'REGISTRAR'"[^>]*routerLink="\.\.\/student-registration"[\s\S]*?New Enrollment[\s\S]*?<\/button>/,
  'New Enrollment banner action should be visible only for the registrar role',
);
