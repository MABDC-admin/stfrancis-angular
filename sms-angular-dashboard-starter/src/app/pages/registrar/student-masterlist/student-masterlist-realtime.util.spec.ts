import assert from 'node:assert/strict';
import { replaceStudentInList } from './student-masterlist-realtime.util';

const currentStudents = [
  {
    id: 'student-1',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    enrollmentStatus: 'For Registrar Verification',
    documentStatus: 'Verified',
  },
  {
    id: 'student-2',
    firstName: 'Kian',
    lastName: 'Dela Cruz',
    enrollmentStatus: 'Officially Enrolled',
    documentStatus: 'Verified',
  },
] as any[];

const updatedStudents = replaceStudentInList(currentStudents, {
  id: 'student-1',
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  enrollmentStatus: 'Registrar Cleared',
  documentStatus: 'Cleared',
} as any);

assert.equal(updatedStudents.length, 2);
assert.equal(updatedStudents[0].enrollmentStatus, 'Registrar Cleared');
assert.equal(updatedStudents[0].documentStatus, 'Cleared');
assert.equal(updatedStudents[1], currentStudents[1]);
assert.notEqual(updatedStudents, currentStudents);
