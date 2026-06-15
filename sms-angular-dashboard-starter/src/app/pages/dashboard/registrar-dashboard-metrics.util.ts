import type { StudentRecord } from '../../core/models/registrar.models';

export interface RegistrarDashboardMetrics {
  totalStudents: number;
  pendingEnrollments: number;
  incompleteDocs: number;
  officiallyEnrolled: number;
}

const pendingEnrollmentStatuses = new Set(['Pending', 'Pending Review', 'Review']);
const officiallyEnrolledStatuses = new Set(['Officially Enrolled', 'Registrar Cleared']);

export function buildRegistrarDashboardMetrics(students: StudentRecord[]): RegistrarDashboardMetrics {
  return {
    totalStudents: students.length,
    pendingEnrollments: students.filter(student => pendingEnrollmentStatuses.has(student.enrollmentStatus)).length,
    incompleteDocs: students.filter(student => student.documentStatus === 'Incomplete').length,
    officiallyEnrolled: students.filter(student => officiallyEnrolledStatuses.has(student.enrollmentStatus)).length,
  };
}
