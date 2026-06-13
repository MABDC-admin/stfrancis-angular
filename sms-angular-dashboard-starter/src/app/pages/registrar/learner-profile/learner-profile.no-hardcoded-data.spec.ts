import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const componentPath = join(
  import.meta.dirname,
  'learner-profile.component.ts'
);
const templatePath = join(
  import.meta.dirname,
  'learner-profile.component.html'
);

const component = readFileSync(componentPath, 'utf8');
const template = readFileSync(templatePath, 'utf8');

[
  'Jane Doe',
  'Smoking',
  'Always Late',
  'Letter of Explaination',
  'Books',
  'Regional Science Fair',
  'Varsity Basketball',
  'Peanuts',
  'Asthma',
  '@school.edu',
  'images.unsplash.com',
].forEach((placeholder) => {
  assert.equal(
    component.includes(placeholder) || template.includes(placeholder),
    false,
    `Learner profile must not render hardcoded placeholder data: ${placeholder}`
  );
});
