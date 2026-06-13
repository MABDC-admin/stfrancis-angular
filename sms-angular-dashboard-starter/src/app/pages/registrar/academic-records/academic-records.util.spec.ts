import assert from 'node:assert/strict';
import {
  buildAcademicRecordStats,
  filterAcademicRecords,
  normalizeAcademicStatus,
  sortAcademicRecords
} from './academic-records.util.ts';

const records = [
  {
    id: '1',
    studentName: 'Lee Brent Cubian',
    gradeLevel: 'Nursery',
    section: 'St. Francis',
    schoolYear: 'SY2026-2027',
    generalAverage: '91',
    remarks: 'Promoted',
    status: 'Validated'
  },
  {
    id: '2',
    studentName: 'Zia Dargantes',
    gradeLevel: 'G1',
    section: 'St. Clare',
    schoolYear: 'SY2026-2027',
    generalAverage: '84',
    remarks: 'For completion',
    status: 'For Review'
  },
  {
    id: '3',
    studentName: 'Juan Dela Cruz',
    gradeLevel: 'G1',
    section: 'St. Clare',
    schoolYear: 'SY2025-2026',
    generalAverage: '77',
    remarks: 'Retained',
    status: 'Incomplete'
  }
];

assert.equal(normalizeAcademicStatus('Promoted'), 'Promoted');
assert.equal(normalizeAcademicStatus('Validated'), 'Validated');
assert.equal(normalizeAcademicStatus('For Review'), 'For Review');
assert.equal(normalizeAcademicStatus('Retained'), 'Retained');
assert.equal(normalizeAcademicStatus('Unknown'), 'Incomplete');

assert.deepEqual(
  filterAcademicRecords(records, 'zia', 'All', 'All', 'All').map((record) => record.id),
  ['2'],
  'search should match learner name'
);

assert.deepEqual(
  filterAcademicRecords(records, '', 'G1', 'SY2026-2027', 'For Review').map((record) => record.id),
  ['2'],
  'grade, year, and status filters should combine'
);

assert.deepEqual(buildAcademicRecordStats(records), {
  total: 3,
  validated: 1,
  forReview: 1,
  promoted: 1,
  retainedOrIncomplete: 1
});

assert.deepEqual(sortAcademicRecords(records).map((record) => record.id), ['2', '1', '3']);

console.log('academic records utility tests passed');
