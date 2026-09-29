import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const template = readFileSync(
  join(process.cwd(), 'src/app/pages/finance/payments/payments.component.html'),
  'utf8',
);
const component = readFileSync(
  join(process.cwd(), 'src/app/pages/finance/payments/payments.component.ts'),
  'utf8',
);

assert.equal(template.includes('editingReceipt'), false, 'Payment history receipt/reference must not be editable');
assert.equal(template.includes('Save Receipt'), false, 'Payment history must not show receipt save action');
assert.match(template, /<td>{{ payment\.receiptNumber }}<\/td>/, 'Payment history should render receipt/reference as plain text');
assert.match(template, /<th>Payee \/ Remarks<\/th>/, 'Payment history should show a payee or remarks column');
assert.match(template, /payment\.remarks/, 'Payment history should render recorded payee remarks');
assert.match(template, /<th>Actions<\/th>/, 'Payment history should show a delete actions column');
assert.match(template, /Delete/, 'Payment history should expose a delete action');
assert.match(component, /deletePayment\(payment: Payment\)/, 'Payments page should define a delete handler.');
assert.match(component, /window\.confirm/, 'Payments page should confirm before deleting a payment.');
assert.match(component, /this\.finance\.deletePayment\(payment\.id\)/, 'Payments page should call the finance delete API.');
assert.match(component, /this\.loadAssessments\(\)/, 'Payments page should refresh assessments after deletion.');
