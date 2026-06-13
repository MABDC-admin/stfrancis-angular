import assert from 'node:assert/strict';
import { buildBillingSummaryRows, summarizeBilling } from './billing-summary.util';

const rows = buildBillingSummaryRows([
  {
    id: 'assessment-1',
    studentId: 'student-1',
    student: {
      id: 'student-1',
      studentNo: 'STU-1',
      lrn: 'LRN-1',
      firstName: 'Ana',
      lastName: 'Santos',
      gradeLevel: 'G1',
      studentType: 'New',
      enrollmentStatus: 'Officially Enrolled',
      documentStatus: 'Complete',
      financeStatus: 'With Balance',
    },
    academicYearId: 'ay-1',
    regularDiscountPercent: 0,
    siblingDiscountPercent: 10,
    scholarshipDiscountPercent: 0,
    grossAmount: 10000,
    discountAmount: 1000,
    netAmount: 9000,
    paidAmount: 4000,
    balance: 5000,
    financeStatus: 'With Balance',
    lineItems: [{ feeTypeId: 'tuition', description: 'Tuition', amount: 10000 }],
    payments: [
      {
        id: 'payment-1',
        studentAssessmentId: 'assessment-1',
        studentId: 'student-1',
        academicYearId: 'ay-1',
        receiptNumber: 'OR-1',
        method: 'Cash',
        amount: 4000,
        paymentDate: '2026-06-11',
      },
    ],
  },
] as any);

assert.equal(rows.length, 1);
assert.equal(rows[0].learnerName, 'Santos, Ana');
assert.equal(rows[0].totalPaid, 4000);
assert.equal(rows[0].outstandingBalance, 5000);
assert.equal(rows[0].recentPayments.length, 1);
assert.equal(rows[0].assessedFees[0].description, 'Tuition');
assert.deepEqual(rows[0].discountLabels, ['Sibling 10%']);
assert.equal(rows[0].discountSummary, 'Sibling 10%');
assert.equal(rows[0].hasDiscount, true);

const summary = summarizeBilling(rows);
assert.equal(summary.learnersBilled, 1);
assert.equal(summary.totalPaid, 4000);
assert.equal(summary.totalBalance, 5000);
assert.equal(summary.collectionRate, 44);
