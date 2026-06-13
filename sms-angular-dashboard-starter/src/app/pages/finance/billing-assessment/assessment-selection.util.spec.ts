import assert from 'node:assert/strict';
import { studentsAvailableForAssessment } from './assessment-selection.util.ts';

const students = [
  { id: 'student-1', firstName: 'Ana', lastName: 'Santos', gradeLevel: 'G1' },
  { id: 'student-2', firstName: 'Juan', lastName: 'Dela Cruz', gradeLevel: 'G1' },
  { id: 'student-3', firstName: 'Mina', lastName: 'Reyes', gradeLevel: 'G2' },
] as any[];

const assessments = [
  { studentId: 'student-2', academicYearId: 'ay-1' },
  { studentId: 'student-3', academicYearId: 'ay-2' },
] as any[];

const available = studentsAvailableForAssessment(students, assessments, 'ay-1');

assert.deepEqual(
  available.map((student) => student.id),
  ['student-1', 'student-3'],
);
