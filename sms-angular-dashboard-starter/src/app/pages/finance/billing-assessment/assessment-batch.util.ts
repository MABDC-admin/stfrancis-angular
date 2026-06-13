import type { SaveAssessmentPayload, StudentAssessmentLineItem } from '../../../core/models/finance.models';

export type BatchAssessmentBase = Omit<SaveAssessmentPayload, 'studentId'>;

export function buildBatchAssessmentPayloads(
  studentIds: string[],
  basePayload: BatchAssessmentBase,
): SaveAssessmentPayload[] {
  return studentIds.map((studentId) => ({
    ...basePayload,
    studentId,
    lineItems: basePayload.lineItems.map((item: StudentAssessmentLineItem) => ({ ...item })),
  }));
}
