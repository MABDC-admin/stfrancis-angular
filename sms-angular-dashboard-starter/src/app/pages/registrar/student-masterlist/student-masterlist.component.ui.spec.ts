import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const template = readFileSync('src/app/pages/registrar/student-masterlist/student-masterlist.component.html', 'utf8');

assert.match(
  template,
  /\*ngFor="let student of filteredStudents; let rowIndex = index; trackBy: trackStudent"/,
  'Student rows should expose rowIndex for alternating row backgrounds',
);

assert.match(
  template,
  /\[ngClass\]="rowIndex % 2 === 0 \? 'bg-white' : 'bg-slate-50\/70'"/,
  'Student rows should alternate between white and soft slate backgrounds',
);

assert.match(
  template,
  /<p class="font-extrabold text-slate-900 text-\[15px\] leading-tight">/,
  'Student names should use readable 15px text in the masterlist',
);
