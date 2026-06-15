import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const template = readFileSync(new URL('./teacher-portal.component.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('./teacher-portal.component.ts', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./teacher-portal.component.scss', import.meta.url), 'utf8');

assert.doesNotMatch(template, /class="module-strip"/);
assert.doesNotMatch(template, /\*ngFor="let module of modules"/);
assert.doesNotMatch(source, /readonly modules\s*=/);
assert.doesNotMatch(styles, /\.module-strip/);
