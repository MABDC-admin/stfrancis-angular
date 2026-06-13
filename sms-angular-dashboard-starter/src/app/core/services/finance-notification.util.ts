import { StudentAssessment } from '../models/finance.models';
import { StudentRecord } from '../models/registrar.models';

export function countLearnersNeedingAssessment(
  students: StudentRecord[],
  assessments: Pick<StudentAssessment, 'studentId' | 'academicYearId'>[],
  academicYearId?: string,
) {
  if (!academicYearId) return 0;

  const assessedStudentIds = new Set(
    assessments
      .filter((assessment) => assessment.academicYearId === academicYearId)
      .map((assessment) => assessment.studentId),
  );

  return students.filter((student) => student.id && !assessedStudentIds.has(student.id)).length;
}
