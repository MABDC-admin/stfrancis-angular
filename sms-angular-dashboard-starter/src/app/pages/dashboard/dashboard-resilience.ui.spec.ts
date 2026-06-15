import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./dashboard.component.ts', import.meta.url), 'utf8');

assert.match(source, /calendarService\.getEvents\(ay\.id\)\.pipe\(catchError\(\(\) => of\(\[\]\)\)\)/);
assert.match(source, /getStudents\(ay\.id\)\.pipe\(catchError\(\(\) => of\(\[\]\)\)\)/);
assert.match(source, /getSections\(ay\.id\)\.pipe\(catchError\(\(\) => of\(\[\]\)\)\)/);
assert.match(source, /getDocumentRequests\(ay\.id\)\.pipe\(catchError\(\(\) => of\(\[\]\)\)\)/);
