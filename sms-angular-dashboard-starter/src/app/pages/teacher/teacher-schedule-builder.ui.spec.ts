import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync('src/app/pages/teacher/teacher-portal.component.ts', 'utf8');
const template = readFileSync('src/app/pages/teacher/teacher-portal.component.html', 'utf8');
const service = readFileSync('src/app/pages/teacher/teacher-portal.service.ts', 'utf8');

for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
  assert.match(component, new RegExp(`['"]${day}['"]`), `Teacher schedule builder should include ${day}.`);
}

assert.match(
  component,
  /scheduleDialogDay/,
  'Teacher schedule module should track the active day dialog.',
);

assert.match(
  component,
  /addScheduleEntry/,
  'Teacher schedule module should save new title and time schedule entries.',
);

assert.match(
  service,
  /schedule-entries/,
  'Teacher portal service should persist schedule entries through the teacher API.',
);

assert.match(
  template,
  /schedule-entry-dialog/,
  'Teacher schedule UI should render a dialog for adding weekday time slots.',
);

assert.match(
  template,
  /scheduleEntriesFor\(day\)/,
  'Teacher schedule UI should render multiple entries for each weekday.',
);
