import assert from 'node:assert/strict';
import {
  buildExecutiveSummary,
  buildGradeEnrollment,
  findAtRiskStudents,
  sortTeachersByWorkload,
  subjectPerformance,
} from './principal-portal.util.ts';

const teachers = [
  { id: 't1', name: 'Maria Santos', department: 'Mathematics', classesHandled: 3, attendanceRate: 98, performance: 91, status: 'Active' },
  { id: 't2', name: 'Joel Reyes', department: 'Science', classesHandled: 5, attendanceRate: 95, performance: 87, status: 'Active' },
];

const students = [
  { id: 's1', name: 'Lee Brent Cubian', gradeLevel: 'Nursery', section: 'St. Anne', average: 92, attendanceRate: 97, status: 'Active' },
  { id: 's2', name: 'Kyrztan Mark Llemit', gradeLevel: 'G7', section: 'St. Clare', average: 73, attendanceRate: 84, status: 'Active' },
  { id: 's3', name: 'Chris Louie Sayod', gradeLevel: 'G7', section: 'St. Clare', average: 81, attendanceRate: 79, status: 'Pending' },
  { id: 's4', name: 'Danaya Suralta', gradeLevel: 'G8', section: 'St. Agnes', average: 88, attendanceRate: 93, status: 'Dropped' },
];

const classes = [
  { id: 'c1', gradeLevel: 'Nursery', section: 'St. Anne', adviser: 'Maria Santos', subject: 'Homeroom', enrollment: 1, average: 92, attendanceRate: 97 },
  { id: 'c2', gradeLevel: 'G7', section: 'St. Clare', adviser: 'Maria Santos', subject: 'Mathematics', enrollment: 2, average: 77, attendanceRate: 82 },
  { id: 'c3', gradeLevel: 'G8', section: 'St. Agnes', adviser: 'Joel Reyes', subject: 'Science', enrollment: 1, average: 88, attendanceRate: 93 },
];

const subjects = [
  { subject: 'Mathematics', gradeLevel: 'G7', quarter: 'Q1', average: 83, passRate: 88 },
  { subject: 'Science', gradeLevel: 'G8', quarter: 'Q1', average: 89, passRate: 94 },
  { subject: 'English', gradeLevel: 'G7', quarter: 'Q1', average: 80, passRate: 85 },
];

const summary = buildExecutiveSummary(students, teachers, classes);

assert.equal(summary.totalStudents, 4);
assert.equal(summary.totalTeachers, 2);
assert.equal(summary.totalClasses, 3);
assert.equal(summary.attendanceRate, 88);
assert.equal(summary.averagePerformance, 84);
assert.deepEqual(summary.enrollmentStatus, { active: 2, pending: 1, dropped: 1 });

assert.deepEqual(
  buildGradeEnrollment(students),
  [
    { gradeLevel: 'G7', total: 2 },
    { gradeLevel: 'G8', total: 1 },
    { gradeLevel: 'Nursery', total: 1 },
  ],
);

assert.deepEqual(
  findAtRiskStudents(students).map(student => student.id),
  ['s2', 's3'],
);

assert.deepEqual(
  sortTeachersByWorkload(teachers).map(teacher => teacher.id),
  ['t2', 't1'],
);

assert.deepEqual(
  subjectPerformance(subjects).map(item => item.subject),
  ['Science', 'Mathematics', 'English'],
);
