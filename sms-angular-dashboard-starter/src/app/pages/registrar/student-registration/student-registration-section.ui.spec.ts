import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const template = readFileSync(
  new URL('./student-registration.component.html', import.meta.url),
  'utf8',
);

const component = readFileSync(
  new URL('./student-registration.component.ts', import.meta.url),
  'utf8',
);

assert.match(template, /name="section"/, 'Student registration form must include a section selector.');
assert.match(template, /availableSectionsForSelectedGrade/, 'Section selector must be filtered by selected grade.');
assert.match(component, /getSections\(/, 'Student registration component must load backend sections.');
assert.match(component, /section:\s*this\.draft\.section/, 'Student registration payload must save selected section.');

console.log('student registration section selector spec passed');
