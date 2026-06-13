import assert from 'node:assert/strict';
import { buildAssessmentStudentOptions } from './assessment-editor.util.ts';

const options = buildAssessmentStudentOptions(
  [
    {
      id: 'student-1',
      lrn: 'LRN-1',
      firstName: 'Ana',
      lastName: 'Santos',
      gradeLevel: 'G7',
      studentType: 'New',
      enrollmentStatus: 'Officially Enrolled',
      documentStatus: 'Complete',
      financeStatus: 'Unassessed',
    },
    {
      id: 'student-2',
      lrn: 'LRN-2',
      firstName: 'Ben',
      lastName: 'Reyes',
      gradeLevel: 'G8',
      studentType: 'Continuing',
      enrollmentStatus: 'Officially Enrolled',
      documentStatus: 'Complete',
      financeStatus: 'With Balance',
    },
  ],
  [{ studentId: 'student-2', academicYearId: 'ay-1' }],
  'ay-1',
);

assert.equal(options.length, 2);
assert.equal(options[0].status, 'New assessment');
assert.equal(options[0].isAssessed, false);
assert.equal(options[1].status, 'Edit assessment');
assert.equal(options[1].isAssessed, true);
