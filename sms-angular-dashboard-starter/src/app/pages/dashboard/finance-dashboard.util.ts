import { Payment, StudentAssessment } from '../../core/models/finance.models';

export interface FinanceChartPoint {
  label: string;
  amount: number;
  percent: number;
}

export interface FinanceDashboardModel {
  academicYearCode: string;
  totalAssessed: number;
  totalRevenue: number;
  expensesTotal: number | null;
  profitLoss: number | null;
  accountsReceivable: number;
  accountsPayable: number | null;
  budgetActualPercent: number | null;
  collectionRate: number;
  paidStudents: number;
  unpaidStudents: number;
  cashFlow: {
    moneyIn: number;
    moneyOut: number | null;
    points: FinanceChartPoint[];
  };
  expenseCategories: FinanceChartPoint[];
  alerts: Array<{ label: string; value: string; tone: 'danger' | 'warning' | 'neutral' }>;
  forecast: {
    label: string;
    value: number;
    points: FinanceChartPoint[];
  };
}

const currencyMonth = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function buildFinanceDashboard(
  assessments: StudentAssessment[],
  payments: Payment[],
  academicYearCode = 'Selected year',
): FinanceDashboardModel {
  const totalRevenue = sum(payments.map((payment) => Number(payment.amount || 0)));
  const accountsReceivable = sum(assessments.map((assessment) => Number(assessment.balance || 0)));
  const totalNet = sum(assessments.map((assessment) => Number(assessment.netAmount || 0)));
  const paidStudents = assessments.filter((assessment) => Number(assessment.balance || 0) <= 0).length;
  const unpaidStudents = assessments.filter((assessment) => Number(assessment.balance || 0) > 0).length;
  const collectionRate = totalNet > 0 ? Math.round((totalRevenue / totalNet) * 100) : 0;
  const cashFlowPoints = buildPaymentPoints(payments);

  return {
    academicYearCode,
    totalAssessed: totalNet,
    totalRevenue,
    expensesTotal: null,
    profitLoss: null,
    accountsReceivable,
    accountsPayable: null,
    budgetActualPercent: null,
    collectionRate,
    paidStudents,
    unpaidStudents,
    cashFlow: {
      moneyIn: totalRevenue,
      moneyOut: null,
      points: cashFlowPoints,
    },
    expenseCategories: [],
    alerts: buildAlerts(unpaidStudents, accountsReceivable),
    forecast: {
      label: 'Projected collections',
      value: accountsReceivable,
      points: cashFlowPoints.length ? cashFlowPoints : [{ label: academicYearCode, amount: 0, percent: 0 }],
    },
  };
}

function buildPaymentPoints(payments: Payment[]): FinanceChartPoint[] {
  const byDate = new Map<string, number>();

  for (const payment of payments) {
    const dateKey = new Date(payment.paymentDate).toISOString().slice(0, 10);
    byDate.set(dateKey, (byDate.get(dateKey) || 0) + Number(payment.amount || 0));
  }

  const maxAmount = Math.max(...byDate.values(), 0);

  return Array.from(byDate.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-8)
    .map(([dateKey, amount]) => ({
      label: currencyMonth.format(new Date(dateKey)),
      amount,
      percent: maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0,
    }));
}

function buildAlerts(unpaidStudents: number, receivable: number): FinanceDashboardModel['alerts'] {
  const alerts: FinanceDashboardModel['alerts'] = [];

  if (unpaidStudents > 0) {
    alerts.push({
      label: 'Learners with open balance',
      value: unpaidStudents.toString(),
      tone: 'danger',
    });
  }

  if (receivable > 0) {
    alerts.push({
      label: 'Receivables need follow-up',
      value: formatPeso(receivable),
      tone: 'warning',
    });
  }

  return alerts.length ? alerts : [{ label: 'No active finance alerts', value: '0', tone: 'neutral' }];
}

export function formatPeso(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Not connected';
  return `₱${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
