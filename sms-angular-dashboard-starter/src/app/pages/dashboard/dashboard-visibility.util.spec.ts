import assert from 'node:assert/strict';
import { shouldShowRegistrarOverview } from './dashboard-visibility.util';

assert.equal(shouldShowRegistrarOverview('REGISTRAR'), true);
assert.equal(shouldShowRegistrarOverview('ADMIN'), true);
assert.equal(shouldShowRegistrarOverview('FINANCE'), false);
assert.equal(shouldShowRegistrarOverview(null), false);
