import type { StudentRecord } from '../../../core/models/registrar.models';

export function buildRegistrarClearancePayload(_: string): Partial<StudentRecord> {
  return {
    documentStatus: 'Cleared',
    enrollmentStatus: 'Officially Enrolled',
  };
}
