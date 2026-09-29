import assert from 'node:assert/strict';
import { displayGradeLevel, gradeLevelMatches, gradeLevelOptions, gradeLevels, normalizeGradeLevel } from './grade-levels.ts';

assert.deepEqual(gradeLevels, [
  'Nursery',
  'K2',
  'G1',
  'G2',
  'G3',
  'G4',
  'G5',
  'G6',
  'G7',
  'G8',
  'G9',
  'G10',
  'G11',
  'G12',
]);

assert.equal(gradeLevelOptions.find(option => option.value === 'K2')?.label, 'Kindergarten');
assert.equal(displayGradeLevel('Nursery'), 'Nursery');
assert.equal(displayGradeLevel('G1'), 'Grade 1');
assert.equal(displayGradeLevel('G12'), 'Grade 12');
assert.equal(displayGradeLevel('Grade 7'), 'Grade 7');
assert.equal(displayGradeLevel(''), 'No grade');

assert.equal(normalizeGradeLevel('Grade 7'), 'G7');
assert.equal(normalizeGradeLevel('Kindergarten'), 'K2');
assert.equal(normalizeGradeLevel('Kinder'), 'K2');
assert.equal(normalizeGradeLevel('Kindergarten 2'), 'K2');
assert.equal(normalizeGradeLevel('K2'), 'K2');
assert.equal(gradeLevelMatches('Grade 7', 'G7'), true);
assert.equal(gradeLevelMatches('G7', 'Grade 7'), true);
assert.equal(gradeLevelMatches('G7', 'G8'), false);
