export interface NewTransferFormData {
  studentName?: string;
  transferDirection?: 'Incoming Transfer' | 'Outgoing Transfer' | 'LRN Transfer';
  previousSchool?: string;
  receivingSchool?: string;
  effectiveDate?: string;
  status?: string;
}

export function buildNewTransferPayload(formData: NewTransferFormData, academicYearId?: string) {
  const movementType = formData.transferDirection || 'Incoming Transfer';
  const status = formData.status || defaultTransferStatus(movementType);
  const payload: any = {
    studentName: formData.studentName?.trim() || '',
    movementType,
    from: formData.previousSchool?.trim() || '',
    to: formData.receivingSchool?.trim() || '',
    effectiveDate: new Date(`${formData.effectiveDate || new Date().toISOString().slice(0, 10)}T00:00:00.000Z`).toISOString(),
    status,
    requestedBy: 'Registrar',
  };

  if (academicYearId) payload.academicYearId = academicYearId;

  return payload;
}

export function defaultTransferStatus(movementType: string): string {
  if (movementType === 'Outgoing Transfer') return 'Pending Release';
  if (movementType === 'LRN Transfer') return 'Pending LRN Request';
  return 'Pending Evaluation';
}
