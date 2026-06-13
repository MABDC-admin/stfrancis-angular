import assert from 'node:assert/strict';
import { shouldCloseModalOnKey } from './learner-profile-modal.util.ts';

assert.equal(
  shouldCloseModalOnKey('Escape', true),
  true,
  'Escape should close an open learner modal'
);

assert.equal(
  shouldCloseModalOnKey('Escape', false),
  false,
  'Escape should not close anything when no learner modal is open'
);

assert.equal(
  shouldCloseModalOnKey('Enter', true),
  false,
  'Non-Escape keys should not close the learner modal'
);
