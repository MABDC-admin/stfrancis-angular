import assert from 'node:assert/strict';
import {
  buildTeacherDisplayName,
  buildAttendanceSummary,
  buildTeacherDashboardSummary,
  buildTeacherPortalInitialState,
  buildTeacherStudentInitials,
  DEFAULT_FEMALE_LEARNER_AVATAR,
  DEFAULT_MALE_LEARNER_AVATAR,
  buildLearnerAttendanceInsights,
  teacherStudentAvatarSource,
  calculateQuarterAverage,
  filterTeacherResources,
  isLegacyTeacherSeedState,
} from './teacher-portal.util.ts';

const classes = [
  { id: 'class-1', section: 'Section A', subject: 'Mathematics', schedule: 'Mon 8:00 AM', room: 'Room 201', studentIds: ['s1', 's2'] },
  { id: 'class-2', section: 'Section B', subject: 'Science', schedule: 'Tue 9:00 AM', room: 'Room 204', studentIds: ['s3'] },
];

const attendance = [
  { id: 'a1', classId: 'class-1', studentId: 's1', date: '2026-06-13', status: 'Present' },
  { id: 'a2', classId: 'class-1', studentId: 's2', date: '2026-06-13', status: 'Late' },
  { id: 'a3', classId: 'class-2', studentId: 's3', date: '2026-06-12', status: 'Absent', reason: 'Sick' },
  { id: 'a4', classId: 'class-1', studentId: 's1', date: '2026-01-10', status: 'Late' },
  { id: 'a5', classId: 'class-1', studentId: 's1', date: '2026-06-14', status: 'Excused', reason: 'Medical appointment' },
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
  Late: 2,
  Excused: 1,
});

const insights = buildLearnerAttendanceInsights(attendance, 's1', 2026, 5);
assert.deepEqual(insights.totals, { Present: 1, Late: 0, Absent: 0, Excused: 1 });
assert.deepEqual(
  insights.monthRecords.map(record => `${record.date}:${record.status}:${record.reason ?? ''}`),
  ['2026-06-13:Present:', '2026-06-14:Excused:Medical appointment'],
);
assert.equal(insights.yearMonths[0].Late, 1);
assert.equal(insights.yearMonths[5].Present, 1);
assert.equal(insights.yearMonths[5].Excused, 1);

assert.deepEqual(
  filterTeacherResources(resources, 'safety').map(resource => resource.id),
  ['r2'],
);

assert.deepEqual(
  filterTeacherResources(resources, 'math').map(resource => resource.id),
  ['r1'],
);

assert.equal(
  buildTeacherDisplayName({ email: 'teacher1@sfxsai.com', firstName: 'Ivy', lastName: 'Ann' }),
  'Ivy Ann',
);

assert.equal(
  buildTeacherDisplayName({ email: 'teacher1@sfxsai.com' }),
  'teacher1@sfxsai.com',
);

assert.equal(buildTeacherStudentInitials({ name: 'Juan Dela Cruz', studentNo: 'SFX-001' }), 'JC');
assert.equal(buildTeacherStudentInitials({ name: '  ', studentNo: 'SFX-2026-2027-001' }), 'S');
assert.equal(buildTeacherStudentInitials({ name: '', studentNo: '' }), 'L');
assert.equal(
  teacherStudentAvatarSource({ name: 'Maria Santos', studentNo: 'SFX-002', gender: 'Female', photoUrl: '' }),
  DEFAULT_FEMALE_LEARNER_AVATAR,
);
assert.equal(
  teacherStudentAvatarSource({ name: 'Maria Santos', studentNo: 'SFX-002', gender: 'FEMALE', photoUrl: '/storage/custom.jpg' }),
  '/storage/custom.jpg',
);
assert.equal(
  teacherStudentAvatarSource({ name: 'Juan Santos', studentNo: 'SFX-003', gender: 'Male', photoUrl: '' }),
  DEFAULT_MALE_LEARNER_AVATAR,
);
assert.equal(
  teacherStudentAvatarSource({ name: 'Learner', studentNo: 'SFX-004', gender: '', photoUrl: '' }),
  '',
);

const emptyTeacherState = buildTeacherPortalInitialState({ email: 'teacher1@sfxsai.com' });
assert.equal(emptyTeacherState.teacher.email, 'teacher1@sfxsai.com');
assert.equal(emptyTeacherState.teacher.name, 'teacher1@sfxsai.com');
assert.deepEqual(emptyTeacherState.classes, []);
assert.deepEqual(emptyTeacherState.students, []);
assert.deepEqual(emptyTeacherState.attendance, []);
assert.deepEqual(emptyTeacherState.grades, []);
assert.deepEqual(emptyTeacherState.resources, []);
assert.deepEqual(emptyTeacherState.dlls, []);
assert.deepEqual(emptyTeacherState.announcements, []);
assert.deepEqual(emptyTeacherState.messages, []);
assert.equal(emptyTeacherState.classes.length, 0);
assert.equal(emptyTeacherState.students.length, 0);

assert.equal(
  isLegacyTeacherSeedState({
    teacher: { name: 'Legacy Teacher', email: 'teacher1@sfxsai.com', department: 'Basic Education', phone: '0917 100 2026', advisoryClass: 'Legacy Advisory' },
    classes: [{ id: 'class-g-legacy', section: 'Legacy Section', subject: 'Mathematics', schedule: 'Mon 8:00 AM', room: 'Room 201', studentIds: ['stu-999'] }],
    students: [{ id: 'stu-999', name: 'Legacy Student', studentNo: 'SFX-2026-2027-999', gradeLevel: 'G7', guardian: '', contact: '' }],
  }),
  true,
);

assert.equal(
  isLegacyTeacherSeedState({
    teacher: emptyTeacherState.teacher,
    classes: [],
    students: [],
  }),
  false,
);
