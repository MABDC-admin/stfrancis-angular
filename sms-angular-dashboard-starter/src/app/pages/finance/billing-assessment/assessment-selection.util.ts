import type { StudentAssessment } from '../../../core/models/finance.models';
import type { StudentRecord } from '../../../core/models/registrar.models';

export function studentsAvailableForAssessment(
  students: StudentRecord[],
  assessments: Pick<StudentAssessment, 'studentId' | 'academicYearId'>[],
  academicYearId?: string,
) {
  const assessedStudentIds = new Set(
    assessments
      .filter((assessment) => assessment.academicYearId === academicYearId)
      .map((assessment) => assessment.studentId),
  );

  return students.filter((student) => student.id && !assessedStudentIds.has(student.id));
}
