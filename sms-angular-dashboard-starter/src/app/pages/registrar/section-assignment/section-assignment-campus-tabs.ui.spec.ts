import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(
  'src/app/pages/registrar/section-assignment/section-assignment.component.ts',
  'utf8',
);
const template = readFileSync(
  'src/app/pages/registrar/section-assignment/section-assignment.component.html',
  'utf8',
);

assert.match(
  component,
  /readonly campusTabs = \['SFXSAI', 'MABDC'\] as const;/,
  'Section assignment should expose the SFXSAI and MABDC tab set.',
);

assert.match(
  component,
  /activeCampusTab: CampusTab = 'SFXSAI';/,
  'Section assignment should default to the SFXSAI tab.',
);

assert.match(
  component,
  /get filteredSections\(\): SectionRecord\[\]/,
  'Section board should render a campus-filtered section list.',
);

assert.match(
  component,
  /this\.filteredSections\.filter\(s => gradeLevelMatches\(s\.gradeLevel, this\.assignGradeLevel\)\)/,
  'Assignment modal should only show target sections from the active campus tab.',
);

assert.match(
  component,
  /showEmptySections = false;/,
  'Section board should hide empty sections by default.',
);

assert.match(
  component,
  /get hiddenEmptySectionCount\(\): number/,
  'Section assignment should expose hidden empty-section count for user context.',
);

assert.match(
  template,
  /section-campus-tabs/,
  'Section assignment template should render campus tabs.',
);

assert.match(
  template,
  /Show empty sections/,
  'Section assignment should render the empty-sections toggle.',
);

assert.match(
  template,
  /\*ngFor="let section of filteredSections"/,
  'Section cards should use the filtered section list.',
);

assert.match(
  component,
  /studentAssignedToSection\(student, section\)/,
  'Viewing a section should list only learners assigned to that section and grade level.',
);

assert.doesNotMatch(
  component,
  /Mia|Liam|Noah|mock-sec/,
  'Section assignment must not inject hardcoded learner or mock section fallback data.',
);
