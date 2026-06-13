import assert from 'node:assert/strict';
import { buildLearnerProfileHubStats, filterLearnerProfiles } from './learner-profile-hub.util.ts';

const learners = [
  {
    firstName: 'Lee Brent',
    lastName: 'Cubian',
    lrn: 'NO-LRN-001',
    studentNo: 'SFX-2026-2027-001',
    gradeLevel: 'Nursery',
    enrollmentStatus: 'Officially Enrolled',
    documentStatus: 'Complete',
    financeStatus: 'Unassessed',
    contactNo: '09606527032',
    address: 'Brgy. Maljo'
  },
  {
    firstName: 'Zia Michiko',
    lastName: 'Dargantes',
    lrn: 'NO-LRN-002',
    studentNo: 'SFX-2026-2027-002',
    gradeLevel: 'G1',
    enrollmentStatus: 'Pending Review',
    documentStatus: 'Pending',
    financeStatus: 'With Balance',
    contactNo: '09123456789',
    address: 'Inopacan'
  }
];

assert.deepEqual(
  filterLearnerProfiles(learners, 'maljo', 'All', 'All').map((learner) => learner.studentNo),
  ['SFX-2026-2027-001'],
  'search should include learner address'
);

assert.deepEqual(
  filterLearnerProfiles(learners, '', 'G1', 'With Balance').map((learner) => learner.studentNo),
  ['SFX-2026-2027-002'],
  'grade and status filters should combine'
);

assert.deepEqual(buildLearnerProfileHubStats(learners), {
  total: 2,
  officiallyEnrolled: 1,
  pendingReview: 1,
  documentIssues: 1,
  financeAttention: 2
});

console.log('learner profile hub utility tests passed');
