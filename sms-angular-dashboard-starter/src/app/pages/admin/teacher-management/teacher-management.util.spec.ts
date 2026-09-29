import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import {
  createInitialTeacherForm,
  defaultAdminTeachers,
  generateTeacherPassword,
  teacherLoadSummaries,
  validateTeacherForm,
} from './teacher-management.util.ts';

const routes = readFileSync(new URL('../../../app.routes.ts', import.meta.url), 'utf8');
const sidebar = readFileSync(new URL('../../../core/data/dashboard.mock.ts', import.meta.url), 'utf8');

assert.match(routes, /teacher-management/i);
assert.match(routes, /TeacherManagementComponent/);
assert.match(sidebar, /Teacher Management/);
assert.match(sidebar, /manage_accounts/);

assert.ok(defaultAdminTeachers.length >= 8, 'seed teacher list should include the configured real teacher accounts');
assert.ok(defaultAdminTeachers.some(teacher => teacher.email === 'casandradante18@gmail.com' && teacher.assignedGradeLevel === 'G7'));
assert.ok(defaultAdminTeachers.some(teacher => teacher.email === 'alwinamarieestremos@gmail.com' && teacher.assignedGradeLevel === 'G8'));

const blank = createInitialTeacherForm();
assert.deepEqual(validateTeacherForm(blank), [
  'Full name is required.',
  'Email address is required.',
  'Contact number is required.',
  'At least one subject is required.',
]);

const password = generateTeacherPassword('Grade 9 Teacher');
assert.equal(password.length >= 10, true);
assert.match(password, /[A-Z]/);
assert.match(password, /[a-z]/);
assert.match(password, /[0-9]/);

const summaries = teacherLoadSummaries(defaultAdminTeachers);
assert.equal(summaries.length, defaultAdminTeachers.length);
assert.ok(summaries.every(summary => summary.weeklyTeachingLoad.endsWith(' hrs/week')));

console.log('teacher management admin spec passed');
