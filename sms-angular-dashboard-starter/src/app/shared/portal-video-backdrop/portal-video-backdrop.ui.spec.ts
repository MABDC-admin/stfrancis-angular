import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const component = readFileSync(
  join(root, 'src/app/shared/portal-video-backdrop/portal-video-backdrop.component.ts'),
  'utf8',
);

assert.match(component, /topbar-flag-bg\.mp4/, 'Shared portal video backdrop should use the SFXSAI flag video asset.');
assert.match(component, /<video/, 'Shared portal video backdrop should render a video element.');
assert.match(component, /muted/, 'Shared portal video backdrop video must be muted.');
assert.match(component, /playsinline/, 'Shared portal video backdrop video must play inline on mobile.');

for (const templatePath of [
  'src/app/pages/teacher/teacher-portal.component.html',
  'src/app/pages/student/student-portal.component.html',
  'src/app/pages/principal/principal-portal.component.html',
  'src/app/pages/registrar/academic-records/academic-records.component.html',
  'src/app/pages/registrar/learner-profile/learner-profile.component.html',
  'src/app/pages/finance/payments/payments.component.html',
  'src/app/pages/finance/billing-assessment/billing-assessment.component.html',
  'src/app/pages/finance/billing-summary/billing-summary.component.html',
  'src/app/pages/finance/student-ledger/student-ledger.component.html',
  'src/app/pages/finance/finance-setup/finance-setup.component.html',
  'src/app/pages/dashboard/dashboard.component.html',
]) {
  const template = readFileSync(join(root, templatePath), 'utf8');
  assert.match(template, /<app-portal-video-backdrop/, `${templatePath} should include the shared video backdrop.`);
}

console.log('portal video backdrop UI test passed');
