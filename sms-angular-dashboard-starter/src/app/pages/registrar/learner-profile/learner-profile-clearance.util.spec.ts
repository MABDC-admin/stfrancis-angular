import assert from 'node:assert/strict';
import { buildRegistrarClearancePayload } from './learner-profile-clearance.util.ts';

assert.deepEqual(
  buildRegistrarClearancePayload('Officially Enrolled'),
  {
    documentStatus: 'Cleared',
    enrollmentStatus: 'Officially Enrolled',
  }
);

assert.deepEqual(
  buildRegistrarClearancePayload('Pending Review'),
  {
    documentStatus: 'Cleared',
    enrollmentStatus: 'Officially Enrolled',
  }
);
