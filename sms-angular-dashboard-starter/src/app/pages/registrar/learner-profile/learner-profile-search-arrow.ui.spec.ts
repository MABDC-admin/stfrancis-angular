import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const template = readFileSync(join(import.meta.dirname, 'learner-profile.component.html'), 'utf8');
const styles = readFileSync(join(import.meta.dirname, 'learner-profile.component.scss'), 'utf8');

assert.match(template, /search-arrow-indicator/, 'Learner Profile hub should render a decorative search arrow indicator.');
assert.match(template, /aria-hidden="true"/, 'Search arrow indicator should be decorative for assistive tech.');
assert.match(styles, /@keyframes\s+searchArrowFloat/, 'Search arrow indicator should have a floating animation.');
assert.match(styles, /\.search-arrow-indicator/, 'Search arrow indicator should have scoped styling.');
assert.match(styles, /max-width:\s*760px[\s\S]*\.search-arrow-indicator[\s\S]*display:\s*none/, 'Search arrow indicator should be hidden on mobile.');

console.log('learner profile search arrow UI test passed');
