import assert from 'node:assert/strict';
import { buildRegistrarDashboardMetrics } from './registrar-dashboard-metrics.util.ts';

const metrics = buildRegistrarDashboardMetrics([
  { enrollmentStatus: 'Officially Enrolled', documentStatus: 'Complete' },
  { enrollmentStatus: 'Registrar Cleared', documentStatus: 'Cleared' },
  { enrollmentStatus: 'Pending Review', documentStatus: 'Pending' },
  { enrollmentStatus: 'Pending', documentStatus: 'Incomplete' },
  { enrollmentStatus: 'Review', documentStatus: 'Complete' },
] as any[]);

assert.equal(metrics.totalStudents, 5);
assert.equal(metrics.officiallyEnrolled, 2);
assert.equal(metrics.pendingEnrollments, 3);
assert.equal(metrics.incompleteDocs, 1);
