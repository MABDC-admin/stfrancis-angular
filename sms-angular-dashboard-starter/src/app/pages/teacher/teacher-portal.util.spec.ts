import assert from 'node:assert/strict';
import {
  buildAttendanceSummary,
  buildTeacherDashboardSummary,
  calculateQuarterAverage,
  filterTeacherResources,
} from './teacher-portal.util.ts';

const classes = [
  { id: 'class-1', section: 'G7 - St. Clare', subject: 'Mathematics', schedule: 'Mon 8:00 AM', room: 'Room 201', studentIds: ['s1', 's2'] },
  { id: 'class-2', section: 'G8 - St. Agnes', subject: 'Science', schedule: 'Tue 9:00 AM', room: 'Room 204', studentIds: ['s3'] },
];

const attendance = [
  { id: 'a1', classId: 'class-1', studentId: 's1', date: '2026-06-13', status: 'Present' },
  { id: 'a2', classId: 'class-1', studentId: 's2', date: '2026-06-13', status: 'Late' },
  { id: 'a3', classId: 'class-2', studentId: 's3', date: '2026-06-12', status: 'Absent' },
];

const grades = [
  { id: 'g1', classId: 'class-1', studentId: 's1', quarter: 'Q1', written: 90, performance: 91, exam: 92 },
  { id: 'g2', classId: 'class-1', studentId: 's2', quarter: 'Q1', written: null, performance: 88, exam: 90 },
];

const resources = [
  { id: 'r1', classId: 'class-1', title: 'Fractions worksheet', type: 'PDF', subject: 'Mathematics', size: '1 MB', uploadedAt: '2026-06-10' },
  { id: 'r2', classId: 'class-2', title: 'Lab safety video', type: 'Video', subject: 'Science', size: '18 MB', uploadedAt: '2026-06-11' },
];

const summary = buildTeacherDashboardSummary(classes, attendance, grades, '2026-06-13');

assert.equal(summary.myClasses, 2);
assert.equal(summary.totalStudents, 3);
assert.equal(summary.attendanceToday, 2);
assert.equal(summary.pendingGrades, 1);

assert.equal(calculateQuarterAverage({ written: 90, performance: 91, exam: 92 }), 91);
assert.equal(calculateQuarterAverage({ written: null, performance: 91, exam: 92 }), null);

assert.deepEqual(buildAttendanceSummary(attendance), {
  Present: 1,
  Absent: 1,
  Late: 1,
  Excused: 0,
});

assert.deepEqual(
  filterTeacherResources(resources, 'safety').map(resource => resource.id),
  ['r2'],
);

assert.deepEqual(
  filterTeacherResources(resources, 'math').map(resource => resource.id),
  ['r1'],
);
