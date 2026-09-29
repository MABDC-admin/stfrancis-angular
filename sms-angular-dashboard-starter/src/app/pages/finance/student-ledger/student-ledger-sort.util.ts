import type { StudentRecord } from '../../../core/models/registrar.models';

function compareValue(value?: string) {
  return (value || '').trim().toLocaleLowerCase();
}

export function sortLedgerStudentsByLastName(students: StudentRecord[]): StudentRecord[] {
  return [...students].sort((left, right) => {
    const byLastName = compareValue(left.lastName).localeCompare(compareValue(right.lastName));
    if (byLastName !== 0) return byLastName;

    const byFirstName = compareValue(left.firstName).localeCompare(compareValue(right.firstName));
    if (byFirstName !== 0) return byFirstName;

    return compareValue(left.middleName).localeCompare(compareValue(right.middleName));
  });
}
