import assert from 'node:assert/strict';
import { dashboardPathForRole } from './role-redirect.util.ts';

assert.equal(dashboardPathForRole('TEACHER'), '/teacher/dashboard');
assert.equal(dashboardPathForRole('STUDENT'), '/student/dashboard');
assert.equal(dashboardPathForRole('PRINCIPAL'), '/principal/dashboard');
assert.equal(dashboardPathForRole('REGISTRAR'), '/registrar/dashboard');
assert.equal(dashboardPathForRole('FINANCE'), '/registrar-finance/dashboard');
assert.equal(dashboardPathForRole('ADMIN'), '/admin/dashboard');
assert.equal(dashboardPathForRole(null), '/auth/login');
