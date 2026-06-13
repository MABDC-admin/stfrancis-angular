import assert from 'node:assert/strict';
import { shouldLoadEnrollmentApplications } from './dashboard-access.util';

assert.equal(shouldLoadEnrollmentApplications('REGISTRAR'), true);
assert.equal(shouldLoadEnrollmentApplications('ADMIN'), true);
assert.equal(shouldLoadEnrollmentApplications('FINANCE'), false);
assert.equal(shouldLoadEnrollmentApplications(null), false);
