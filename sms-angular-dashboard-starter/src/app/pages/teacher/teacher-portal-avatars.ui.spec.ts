import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const template = readFileSync(join(import.meta.dirname, 'teacher-portal.component.html'), 'utf8');
const styles = readFileSync(join(import.meta.dirname, 'teacher-portal.component.scss'), 'utf8');
const femaleDefaultAsset = join(import.meta.dirname, '..', '..', '..', 'assets', 'learner-default-female.png');

const avatarHolderCount = (template.match(/class="learner-avatar"/g) ?? []).length;

assert.ok(
  avatarHolderCount >= 3,
  `Expected learner avatar holders in class roster, attendance, and grades surfaces; found ${avatarHolderCount}.`,
);
assert.match(template, /\*ngIf="learnerAvatarSource\(student\); else learnerInitials"/);
assert.match(template, /learnerAvatarSource\(student\)/);
assert.match(template, /buildTeacherStudentInitials\(student\)/);
assert.match(styles, /\.learner-identity/);
assert.match(styles, /\.learner-avatar/);
assert.match(styles, /\.learner-avatar img/);
assert.ok(existsSync(femaleDefaultAsset), 'Expected female default learner avatar asset to exist.');

console.log('teacher portal learner avatar UI test passed');
