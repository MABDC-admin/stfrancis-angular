import assert from 'node:assert/strict';
import { buildDiscountBreakdown } from './finance-discount.util';

const breakdown = buildDiscountBreakdown({
  regularDiscountPercent: 5,
  siblingDiscountPercent: 10,
  scholarshipDiscountPercent: 25,
  discountAmount: 3600,
} as any);

assert.deepEqual(breakdown.labels, ['Regular 5%', 'Sibling 10%', 'Scholarship 25%']);
assert.equal(breakdown.summary, 'Regular 5% + Sibling 10% + Scholarship 25%');
assert.equal(breakdown.hasDiscount, true);

const none = buildDiscountBreakdown({
  regularDiscountPercent: 0,
  siblingDiscountPercent: 0,
  scholarshipDiscountPercent: 0,
  discountAmount: 0,
} as any);

assert.deepEqual(none.labels, ['No discount']);
assert.equal(none.hasDiscount, false);
