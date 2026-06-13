import type { EnrollmentApplication, StudentRecord } from '../../../core/models/registrar.models';

export function buildEnrollmentListFromStudents(students: StudentRecord[]): EnrollmentApplication[] {
  return [...students]
    .sort((a, b) => {
      const aTime = Date.parse(a.enrollmentSubmittedAt || a.lastUpdated || '');
      const bTime = Date.parse(b.enrollmentSubmittedAt || b.lastUpdated || '');
      const timeDiff = (Number.isFinite(aTime) ? aTime : Number.MAX_SAFE_INTEGER) -
        (Number.isFinite(bTime) ? bTime : Number.MAX_SAFE_INTEGER);
      return timeDiff || (a.studentNo || '').localeCompare(b.studentNo || '');
    })
    .map((student) => ({
      id: student.id || student.studentNo || student.lrn,
      applicationNo: student.studentNo || student.id || student.lrn,
      studentName: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' '),
      gradeLevel: student.gradeLevel,
      studentType: student.studentType,
      status: student.enrollmentStatus,
      documentStatus: student.documentStatus,
      financeStatus: student.financeStatus,
      submittedAt: student.enrollmentSubmittedAt || student.lastUpdated || '',
      reviewedBy: '',
      remarks: '',
    }));
}
