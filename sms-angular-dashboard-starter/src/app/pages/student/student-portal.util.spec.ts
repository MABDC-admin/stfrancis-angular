import assert from 'node:assert/strict';
import {
  buildAssignmentCompletionRate,
  buildAttendancePercentage,
  buildStudentDashboardSummary,
  calculateGeneralAverage,
  filterPendingAssignments,
  filterStudentResources,
  isPendingAssignmentStatus,
  nextPendingAssignmentId,
  performanceLabelFor,
} from './student-portal.util.ts';

const classes = [
  { id: 'class-1', subject: 'Mathematics', teacher: 'Ms. Santos', schedule: 'Mon 8:00 AM', room: 'Room 201', progress: 72 },
  { id: 'class-2', subject: 'Science', teacher: 'Mr. Reyes', schedule: 'Tue 9:00 AM', room: 'Lab 1', progress: 64 },
];

const grades = [
  { id: 'g1', classId: 'class-1', quarter: 'Q1', written: 91, performance: 93, exam: 92 },
  { id: 'g2', classId: 'class-2', quarter: 'Q1', written: 82, performance: 85, exam: 83 },
];

const attendance = [
  { id: 'a1', classId: 'class-1', date: '2026-06-13', status: 'Present' },
  { id: 'a2', classId: 'class-1', date: '2026-06-12', status: 'Absent' },
  { id: 'a3', classId: 'class-2', date: '2026-06-13', status: 'Late' },
];

const assignments = [
  { id: 'as1', classId: 'class-1', title: 'Worksheet', dueDate: '2026-06-15', status: 'Submitted' },
  { id: 'as2', classId: 'class-2', title: 'Lab reflection', dueDate: '2026-06-16', status: 'In progress' },
  { id: 'as3', classId: 'class-2', title: 'Reading log', dueDate: '2026-06-17', status: 'Graded' },
];

const resources = [
  { id: 'r1', classId: 'class-1', title: 'Algebra guide', subject: 'Mathematics', type: 'PDF', size: '2 MB' },
  { id: 'r2', classId: 'class-2', title: 'Cell video', subject: 'Science', type: 'Video', size: '18 MB' },
];

const summary = buildStudentDashboardSummary(classes, assignments, attendance, grades, '2026-06-13');

assert.equal(summary.enrolledClasses, 2);
assert.equal(summary.pendingAssignments, 1);
assert.equal(summary.attendanceToday, 'Present / Late');
assert.equal(summary.generalAverage, 88);

assert.equal(calculateGeneralAverage(grades), 88);
assert.equal(performanceLabelFor(95), 'Excellent');
assert.equal(performanceLabelFor(84), 'Good');
assert.equal(performanceLabelFor(74), 'Needs Improvement');
assert.equal(buildAttendancePercentage(attendance), 67);
assert.equal(buildAssignmentCompletionRate(assignments), 67);
assert.equal(isPendingAssignmentStatus('Not started'), true);
assert.equal(isPendingAssignmentStatus('In progress'), true);
assert.equal(isPendingAssignmentStatus('Late'), true);
assert.equal(isPendingAssignmentStatus('Submitted'), false);
assert.equal(isPendingAssignmentStatus('Graded'), false);

assert.deepEqual(
  filterPendingAssignments(assignments).map(assignment => assignment.id),
  ['as2'],
);

assert.equal(nextPendingAssignmentId(assignments, 'as1'), 'as2');
assert.equal(nextPendingAssignmentId(assignments, 'as2'), 'as2');
assert.equal(nextPendingAssignmentId(assignments, 'missing'), 'as2');
assert.equal(nextPendingAssignmentId(assignments.filter(assignment => assignment.status !== 'In progress'), 'as1'), 'as1');

assert.deepEqual(
  filterStudentResources(resources, 'cell').map(resource => resource.id),
  ['r2'],
);

assert.deepEqual(
  filterStudentResources(resources, 'math').map(resource => resource.id),
  ['r1'],
);
