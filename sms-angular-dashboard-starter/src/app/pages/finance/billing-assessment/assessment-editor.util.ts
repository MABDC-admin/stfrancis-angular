import type { StudentAssessment } from '../../../core/models/finance.models';
import type { StudentRecord } from '../../../core/models/registrar.models';

export interface AssessmentStudentOption {
  student: StudentRecord;
  isAssessed: boolean;
  status: 'New assessment' | 'Edit assessment';
}

export function buildAssessmentStudentOptions(
  students: StudentRecord[],
  assessments: Pick<StudentAssessment, 'studentId' | 'academicYearId'>[],
  academicYearId?: string,
): AssessmentStudentOption[] {
  const assessedStudentIds = new Set(
    assessments
      .filter((assessment) => assessment.academicYearId === academicYearId)
      .map((assessment) => assessment.studentId),
  );

  return students
    .filter((student) => !!student.id)
    .map((student) => {
      const isAssessed = assessedStudentIds.has(student.id as string);
      return {
        student,
        isAssessed,
        status: isAssessed ? 'Edit assessment' : 'New assessment',
      };
    });
}
