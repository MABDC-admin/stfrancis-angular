import { Payment, StudentAssessment, StudentAssessmentLineItem } from '../../../core/models/finance.models';
import { buildDiscountBreakdown } from '../finance-discount.util';

export interface BillingSummaryRow {
  assessmentId: string;
  studentId: string;
  learnerName: string;
  studentNo: string;
  lrn: string;
  gradeLevel: string;
  financeStatus: string;
  assessedTotal: number;
  discountAmount: number;
  discountLabels: string[];
  discountSummary: string;
  hasDiscount: boolean;
  totalPaid: number;
  outstandingBalance: number;
  dueDateLabel: string;
  recentPayments: Payment[];
  payments: Payment[];
  assessedFees: StudentAssessmentLineItem[];
}

export interface BillingSummaryTotals {
  learnersBilled: number;
  totalPaid: number;
  totalBalance: number;
  assessedTotal: number;
  collectionRate: number;
}

export function buildBillingSummaryRows(assessments: StudentAssessment[]): BillingSummaryRow[] {
  return assessments.map((assessment) => {
    const payments = [...(assessment.payments || [])].sort((left, right) =>
      new Date(right.paymentDate).getTime() - new Date(left.paymentDate).getTime(),
    );
    const student = assessment.student;
    const discount = buildDiscountBreakdown(assessment);

    return {
      assessmentId: assessment.id,
      studentId: assessment.studentId,
      learnerName: student ? `${student.lastName}, ${student.firstName}` : 'Unknown learner',
      studentNo: student?.studentNo || '-',
      lrn: student?.lrn || '-',
      gradeLevel: student?.gradeLevel || '-',
      financeStatus: assessment.financeStatus,
      assessedTotal: Number(assessment.netAmount || 0),
      discountAmount: Number(assessment.discountAmount || 0),
      discountLabels: discount.labels,
      discountSummary: discount.summary,
      hasDiscount: discount.hasDiscount,
      totalPaid: Number(assessment.paidAmount || 0),
      outstandingBalance: Number(assessment.balance || 0),
      dueDateLabel: 'No due date set',
      recentPayments: payments.slice(0, 3),
      payments,
      assessedFees: assessment.lineItems || [],
    };
  });
}

export function summarizeBilling(rows: BillingSummaryRow[]): BillingSummaryTotals {
  const assessedTotal = rows.reduce((sum, row) => sum + row.assessedTotal, 0);
  const totalPaid = rows.reduce((sum, row) => sum + row.totalPaid, 0);
  const totalBalance = rows.reduce((sum, row) => sum + row.outstandingBalance, 0);

  return {
    learnersBilled: rows.length,
    totalPaid,
    totalBalance,
    assessedTotal,
    collectionRate: assessedTotal > 0 ? Math.round((totalPaid / assessedTotal) * 100) : 0,
  };
}
