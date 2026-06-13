import assert from 'node:assert/strict';
import { shouldBlockEnrollmentReview } from './enrollment-review.util.ts';

assert.equal(
  shouldBlockEnrollmentReview('Officially Enrolled'),
  true,
  'Officially enrolled learners should not open the review modal'
);

assert.equal(
  shouldBlockEnrollmentReview('Pending Review'),
  false,
  'Pending review learners should still open the review modal'
);

assert.equal(
  shouldBlockEnrollmentReview('For Finance Assessment'),
  false,
  'Finance assessment learners use their own warning flow'
);
