import assert from 'node:assert/strict';
import { buildPrintableHtml } from './pdf-export.util';

const html = buildPrintableHtml({
  title: 'Finance Dashboard',
  subtitle: 'SY2026-2027',
  contentHtml: '<section class="finance-page"><h1>Total Revenue</h1></section>',
  styleLinks: ['/styles.css'],
  inlineStyles: ['.finance-page{background:#fff;}'],
});

assert.match(html, /<title>Finance Dashboard<\/title>/);
assert.match(html, /SY2026-2027/);
assert.match(html, /Total Revenue/);
assert.match(html, /href="\/styles.css"/);
assert.match(html, /window\.print\(\)/);
assert.match(html, /\.pdf-export-button/);
