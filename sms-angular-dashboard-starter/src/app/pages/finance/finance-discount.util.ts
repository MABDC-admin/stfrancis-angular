import { StudentAssessment } from '../../core/models/finance.models';

export interface DiscountBreakdown {
  labels: string[];
  summary: string;
  hasDiscount: boolean;
}

export function buildDiscountBreakdown(assessment: Pick<
  StudentAssessment,
  'regularDiscountPercent' | 'siblingDiscountPercent' | 'scholarshipDiscountPercent' | 'discountAmount'
>): DiscountBreakdown {
  const labels = [
    labelPercent('Regular', assessment.regularDiscountPercent),
    labelPercent('Sibling', assessment.siblingDiscountPercent),
    labelPercent('Scholarship', assessment.scholarshipDiscountPercent),
  ].filter(Boolean) as string[];

  if (!labels.length) {
    return {
      labels: ['No discount'],
      summary: 'No discount',
      hasDiscount: false,
    };
  }

  return {
    labels,
    summary: labels.join(' + '),
    hasDiscount: Number(assessment.discountAmount || 0) > 0,
  };
}

function labelPercent(label: string, value: number) {
  const percent = Number(value || 0);
  return percent > 0 ? `${label} ${percent}%` : '';
}
