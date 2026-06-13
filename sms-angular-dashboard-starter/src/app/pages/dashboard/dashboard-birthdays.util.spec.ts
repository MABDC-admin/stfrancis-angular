import assert from 'node:assert/strict';
import { buildUpcomingBirthdays } from './dashboard-birthdays.util';

const birthdays = buildUpcomingBirthdays(
  [
    {
      id: 'student-1',
      lrn: '1001',
      firstName: 'Ana',
      lastName: 'Santos',
      birthdate: '2012-06-14',
      gradeLevel: 'G7',
      studentType: 'New',
      enrollmentStatus: 'Officially Enrolled',
      documentStatus: 'Complete',
      financeStatus: 'Cleared',
    },
    {
      id: 'student-2',
      lrn: '1002',
      firstName: 'Ben',
      lastName: 'Reyes',
      birthdate: '2011-07-05',
      gradeLevel: 'G8',
      studentType: 'Old',
      enrollmentStatus: 'Officially Enrolled',
      documentStatus: 'Complete',
      financeStatus: 'With Balance',
    },
    {
      id: 'student-3',
      lrn: '1003',
      firstName: 'Cora',
      lastName: 'Diaz',
      birthdate: '2013-06-10',
      gradeLevel: 'G6',
      studentType: 'Old',
      enrollmentStatus: 'Officially Enrolled',
      documentStatus: 'Complete',
      financeStatus: 'Cleared',
    },
  ],
  new Date('2026-06-11T00:00:00'),
  30,
);

assert.equal(birthdays.length, 2);
assert.equal(birthdays[0].learnerName, 'Santos, Ana');
assert.equal(birthdays[0].dateLabel, 'Jun 14');
assert.equal(birthdays[0].daysUntil, 3);
assert.equal(birthdays[1].learnerName, 'Reyes, Ben');
