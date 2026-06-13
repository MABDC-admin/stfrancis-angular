import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const template = readFileSync(
  join(process.cwd(), 'src/app/pages/dashboard/dashboard.component.html'),
  'utf8',
);

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
  assert.equal(template.includes(label), false, `${label} should not render in the finance dashboard`);
}

assert.equal(template.includes('Birthday'), true, 'Finance dashboard should include incoming learner birthdays');

assert.match(
  template,
  /<button[^>]*\*ngIf="role === 'REGISTRAR'"[^>]*routerLink="\.\.\/student-registration"[\s\S]*?New Enrollment[\s\S]*?<\/button>/,
  'New Enrollment banner action should be visible only for the registrar role',
);
