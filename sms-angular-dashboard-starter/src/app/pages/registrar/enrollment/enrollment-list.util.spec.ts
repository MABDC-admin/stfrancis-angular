import assert from 'node:assert/strict';
import { buildEnrollmentListFromStudents } from './enrollment-list.util.ts';

const list = buildEnrollmentListFromStudents([
  {
    id: 'student-2',
    studentNo: 'SFX-2026-2027-002',
    lrn: 'NO-LRN-2',
    firstName: 'Jean Kyrie',
    middleName: 'Declaro',
    lastName: 'Dadula',
    gradeLevel: 'Nursery',
    studentType: 'Continuing',
    enrollmentStatus: 'Officially Enrolled',
    documentStatus: 'Complete',
    financeStatus: 'Unassessed',
    enrollmentSubmittedAt: '2026-06-03T16:39:19.947Z',
    lastUpdated: '2026-06-12T00:00:00.000Z',
  },
  {
    id: 'student-1',
    studentNo: 'SFX-2026-2027-001',
    lrn: 'NO-LRN-1',
    firstName: 'Lee Brent',
    middleName: 'Ruado',
    lastName: 'Cubian',
    gradeLevel: 'Nursery',
    studentType: 'New',
    enrollmentStatus: 'Officially Enrolled',
    documentStatus: 'Complete',
    financeStatus: 'Unassessed',
    enrollmentSubmittedAt: '2026-06-04T09:21:38.673Z',
    lastUpdated: '2026-06-11T00:00:00.000Z',
  },
] as any[]);

assert.equal(list.length, 2);
assert.equal(list[0].id, 'student-2');
assert.equal(list[0].applicationNo, 'SFX-2026-2027-002');
assert.equal(list[0].submittedAt, '2026-06-03T16:39:19.947Z');
assert.equal(list[1].id, 'student-1');
assert.equal(list[1].studentName, 'Lee Brent Ruado Cubian');
assert.equal(list[1].gradeLevel, 'Nursery');
assert.equal(list[0].status, 'Officially Enrolled');
assert.equal(list[0].documentStatus, 'Complete');
assert.equal(list[0].financeStatus, 'Unassessed');
