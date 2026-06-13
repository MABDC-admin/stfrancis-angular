import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const template = readFileSync(
  join(process.cwd(), 'src/app/pages/finance/payments/payments.component.html'),
  'utf8',
);

assert.equal(template.includes('editingReceipt'), false, 'Payment history receipt/reference must not be editable');
assert.equal(template.includes('Save Receipt'), false, 'Payment history must not show receipt save action');
assert.match(template, /<td>{{ payment\.receiptNumber }}<\/td>/, 'Payment history should render receipt/reference as plain text');
