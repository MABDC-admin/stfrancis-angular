import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sidebar = readFileSync('src/app/layout/sidebar/sidebar.component.html', 'utf8');
const routes = readFileSync('src/app/app.routes.ts', 'utf8');
const login = readFileSync('src/app/pages/auth/login.component.ts', 'utf8');

assert.equal(/School MS|>SMS</.test(sidebar), false, 'Sidebar must not use generic School MS/SMS branding');
assert.match(sidebar, /assets\/logo\.png/, 'Sidebar should render the SFXSAI logo asset');
assert.match(sidebar, />SFXSAI</, 'Sidebar should show SFXSAI as the portal brand');
assert.equal(routes.includes('School MS'), false, 'Browser titles should use SFXSAI branding');
assert.equal(login.includes('School Logo'), false, 'Login logo alt text should use SFXSAI branding');
