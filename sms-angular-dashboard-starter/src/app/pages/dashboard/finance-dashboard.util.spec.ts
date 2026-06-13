import assert from 'node:assert/strict';
import { buildFinanceDashboard } from './finance-dashboard.util';

const dashboard = buildFinanceDashboard(
  [
    {
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      regularDiscountPercent: 0,
      siblingDiscountPercent: 0,
      scholarshipDiscountPercent: 0,
      grossAmount: 10000,
      discountAmount: 0,
      netAmount: 10000,
      paidAmount: 7500,
      balance: 2500,
      financeStatus: 'With Balance',
    },
    {
      id: 'assessment-2',
      studentId: 'student-2',
      academicYearId: 'ay-1',
      regularDiscountPercent: 0,
      siblingDiscountPercent: 0,
      scholarshipDiscountPercent: 0,
      grossAmount: 5000,
      discountAmount: 0,
      netAmount: 5000,
      paidAmount: 5000,
      balance: 0,
      financeStatus: 'Cleared',
    },
  ],
  [
    {
      id: 'payment-1',
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      receiptNumber: 'OR-1',
      method: 'Cash',
      amount: 7500,
      paymentDate: '2026-06-10',
    },
    {
      id: 'payment-2',
      studentAssessmentId: 'assessment-2',
      studentId: 'student-2',
      academicYearId: 'ay-1',
      receiptNumber: 'OR-2',
      method: 'GCash',
      amount: 5000,
      paymentDate: '2026-06-11',
    },
  ],
  'SY2026-2027',
);

assert.equal(dashboard.totalRevenue, 12500);
assert.equal(dashboard.totalAssessed, 15000);
assert.equal(dashboard.accountsReceivable, 2500);
assert.equal(dashboard.collectionRate, 83);
assert.equal(dashboard.paidStudents, 1);
assert.equal(dashboard.unpaidStudents, 1);
assert.deepEqual(
  dashboard.cashFlow.points.map((point) => point.amount),
  [7500, 5000],
);
assert.equal(dashboard.alerts[0].value, '1');
