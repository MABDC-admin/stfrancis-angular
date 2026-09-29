import assert from 'node:assert/strict';
import { sortLedgerStudentsByLastName } from './student-ledger-sort.util.ts';

const sorted = sortLedgerStudentsByLastName([
  {
    id: '3',
    lrn: '3',
    firstName: 'Jayden Kris',
    lastName: 'Dargantes',
    gradeLevel: 'Nursery',
    studentType: 'New',
    enrollmentStatus: 'Officially Enrolled',
    documentStatus: 'Complete',
    financeStatus: 'With Balance',
  },
  {
    id: '2',
    lrn: '2',
    firstName: 'Adam Grefelmar Quibel',
    lastName: 'Baliong',
    gradeLevel: 'G6',
    studentType: 'New',
    enrollmentStatus: 'Officially Enrolled',
    documentStatus: 'Complete',
    financeStatus: 'With Balance',
  },
  {
    id: '1',
    lrn: '1',
    firstName: 'Aamir Quibel',
    lastName: 'Baliong',
    gradeLevel: 'Nursery',
    studentType: 'New',
    enrollmentStatus: 'Officially Enrolled',
    documentStatus: 'Complete',
    financeStatus: 'With Balance',
  },
] as any);

assert.deepEqual(
  sorted.map((student) => `${student.lastName}, ${student.firstName}`),
  ['Baliong, Aamir Quibel', 'Baliong, Adam Grefelmar Quibel', 'Dargantes, Jayden Kris'],
);
