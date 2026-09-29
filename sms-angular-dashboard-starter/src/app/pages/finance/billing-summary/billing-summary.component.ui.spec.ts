import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const template = readFileSync(
  join(process.cwd(), 'src/app/pages/finance/billing-summary/billing-summary.component.html'),
  'utf8',
);

assert.match(template, /payment\.remarks/, 'Billing summary recent payments should show payee remarks');
