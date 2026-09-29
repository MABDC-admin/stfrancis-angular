import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(
  'src/app/pages/registrar/classes/classes.component.ts',
  'utf8',
);
const template = readFileSync(
  'src/app/pages/registrar/classes/classes.component.html',
  'utf8',
);

assert.match(
  component,
  /activeCampusTab: CampusTab = 'SFXSAI';/,
  'Classes Management should default to the SFXSAI campus tab.',
);

assert.match(
  component,
  /sectionBelongsToCampus\(s, this\.activeCampusTab\)/,
  'Classes Management should filter sections by active campus before rendering.',
);

assert.match(
  component,
  /gradeLevelMatches\(s\.gradeLevel, this\.selectedSection\?\.gradeLevel\)/,
  'Classes Management learner list should match selected section and grade level.',
);

assert.match(
  template,
  /classes-campus-tabs/,
  'Classes Management template should expose SFXSAI and MABDC campus tabs.',
);
