import assert from 'node:assert/strict';
import { buildFinanceDashboard } from './finance-dashboard.util.ts';

const dashboard = buildFinanceDashboard(
  [
    {
      id: 'assessment-1',
      studentId: 'student-1',
      student: {
        id: 'student-1',
        lrn: 'LRN-1',
        firstName: 'Anna',
        lastName: 'Santos',
        gradeLevel: 'Grade 4',
        studentType: 'Regular',
        enrollmentStatus: 'Enrolled',
        documentStatus: 'Complete',
        financeStatus: 'With Balance',
      },
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
      student: {
        id: 'student-2',
        lrn: 'LRN-2',
        firstName: 'Ben',
        lastName: 'Reyes',
        gradeLevel: 'Grade 5',
        studentType: 'Regular',
        enrollmentStatus: 'Enrolled',
        documentStatus: 'Complete',
        financeStatus: 'Cleared',
      },
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
assert.equal(dashboard.totalRevenueCard.helper, 'SY2026-2027 collections posted');
assert.equal(dashboard.totalAssessedCard.helper, 'SY2026-2027 net assessed tuition and fees');
assert.equal(dashboard.totalAssessedCard.assessmentCount, 2);
assert.equal(dashboard.receivablesCard.openAccountsCount, 1);
assert.equal(dashboard.receivablesCard.summaryRows[0].label, 'Collected Total');
assert.equal(dashboard.receivablesCard.summaryRows[0].value, 12500);
assert.equal(dashboard.receivablesCard.summaryRows[1].label, 'Pending Total');
assert.equal(dashboard.receivablesCard.summaryRows[1].value, 2500);
assert.equal(dashboard.receivablesCard.summaryRows[2].label, 'Total Open Balance');
assert.equal(dashboard.receivablesCard.summaryRows[2].value, 2500);
assert.equal(dashboard.receivablesCard.learners.length, 1);
assert.equal(dashboard.alertRows.length > 0, true);
assert.equal(dashboard.forecast.comparisonText, '83% of net assessed amount collected');
assert.equal(dashboard.birthdayCardCtaLabel, 'Open Account');
assert.equal(
  dashboard.receivablesCard.summaryRows.some((row) => /due|overdue|31-60|61-90|90\+/.test(row.label.toLowerCase())),
  false,
);
assert.deepEqual(
  dashboard.cashFlow.points.map((point) => point.amount),
  [7500, 5000],
);
assert.equal(dashboard.alerts[0].value, '1');
