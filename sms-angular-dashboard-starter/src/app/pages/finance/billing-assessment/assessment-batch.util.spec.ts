import assert from 'node:assert/strict';
import { buildBatchAssessmentPayloads } from './assessment-batch.util.ts';

const payloads = buildBatchAssessmentPayloads(
  ['student-1', 'student-2'],
  {
    academicYearId: 'ay-1',
    feeTemplateId: 'template-1',
    regularDiscountPercent: 5,
    siblingDiscountPercent: 10,
    scholarshipDiscountPercent: 0,
    lineItems: [
      {
        feeTypeId: 'fee-1',
        description: 'Tuition',
        amount: 9000,
        sourceFeeTemplateLineItemId: 'line-1',
      },
    ],
  },
);

assert.equal(payloads.length, 2);
assert.deepEqual(
  payloads.map((payload) => payload.studentId),
  ['student-1', 'student-2'],
);
assert.equal(payloads[0].lineItems[0].description, 'Tuition');
assert.notEqual(payloads[0].lineItems, payloads[1].lineItems);
