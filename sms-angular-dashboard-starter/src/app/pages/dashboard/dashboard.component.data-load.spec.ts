import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/app/pages/dashboard/dashboard.component.ts', 'utf8');

assert.match(
  source,
  /this\.api\.refreshAcademicYears\(\);/,
  'Dashboard should initialize the active academic year when opened directly',
);

assert.match(
  source,
  /this\.api\.getDashboardOverview\(ay\.id\)/,
  'Dashboard should load page data through the composite dashboard summary endpoint',
);
