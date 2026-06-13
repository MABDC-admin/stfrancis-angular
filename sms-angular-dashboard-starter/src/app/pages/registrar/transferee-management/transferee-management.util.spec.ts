import assert from 'node:assert/strict';
import { buildNewTransferPayload } from './transferee-management.util.ts';

const payload = buildNewTransferPayload(
  {
    studentName: 'Juan Dela Cruz',
    transferDirection: 'Incoming Transfer',
    previousSchool: 'Old School',
    receivingSchool: 'SFXSAI',
    effectiveDate: '2026-06-15',
    status: '',
  },
  'ay-2026'
);

assert.deepEqual(payload, {
  studentName: 'Juan Dela Cruz',
  movementType: 'Incoming Transfer',
  from: 'Old School',
  to: 'SFXSAI',
  effectiveDate: '2026-06-15T00:00:00.000Z',
  status: 'Pending Evaluation',
  requestedBy: 'Registrar',
  academicYearId: 'ay-2026',
});

assert.equal(
  buildNewTransferPayload(
    {
      studentName: 'Maria Santos',
      transferDirection: 'Outgoing Transfer',
      previousSchool: 'SFXSAI',
      receivingSchool: 'Next School',
      effectiveDate: '2026-07-01',
      status: 'Pending Release',
    },
    undefined
  ).academicYearId,
  undefined,
  'Academic year should be omitted when not selected'
);
