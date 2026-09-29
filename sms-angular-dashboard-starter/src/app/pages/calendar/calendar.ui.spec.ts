import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(
  'src/app/pages/calendar/calendar.component.ts',
  'utf8',
);

assert.match(
  component,
  /RegistrarApiService/,
  'Calendar page should access the active academic year service.',
);

assert.match(
  component,
  /academicYearId: this\.api\.getActiveAcademicYearId\(\)/,
  'Saved calendar events should be tagged with the active academic year.',
);

assert.match(
  component,
  /this\.calendarService\.getEvents\(this\.api\.getActiveAcademicYearId\(\)\)/,
  'Calendar page should load events for the active academic year so the page matches the dashboard widget.',
);
