import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const template = readFileSync(
  join(process.cwd(), 'src/app/pages/finance/student-ledger/student-ledger.component.html'),
  'utf8',
);
const component = readFileSync(
  join(process.cwd(), 'src/app/pages/finance/student-ledger/student-ledger.component.ts'),
  'utf8',
);

assert.match(template, /<th>Payee \/ Remarks<\/th>/, 'Student ledger payment history should show a payee or remarks column');
assert.match(template, /payment\.remarks/, 'Student ledger should render recorded payee remarks');
assert.match(template, /<th>Actions<\/th>/, 'Student ledger should show an actions column for payments.');
assert.match(template, /Delete/, 'Student ledger should expose a delete action in payment history.');
assert.match(component, /deletePayment\(payment: Payment\)/, 'Student ledger should define a delete handler.');
assert.match(component, /window\.confirm/, 'Student ledger should confirm before deleting a payment.');
assert.match(component, /this\.finance\.deletePayment\(payment\.id\)/, 'Student ledger should call the finance delete API.');
assert.match(component, /this\.loadLedger\(\)/, 'Student ledger should reload the ledger after deletion.');
