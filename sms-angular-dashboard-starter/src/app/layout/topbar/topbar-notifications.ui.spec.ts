import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync('src/app/layout/topbar/topbar.component.ts', 'utf8');
const template = readFileSync('src/app/layout/topbar/topbar.component.html', 'utf8');
const styles = readFileSync('src/app/layout/topbar/topbar.component.scss', 'utf8');

assert.match(component, /notificationItems/, 'Topbar should expose computed notification dropdown items.');
assert.match(component, /toggleNotifications/, 'Topbar should toggle the notification dropdown from the bell.');
assert.match(component, /selectNotification/, 'Topbar should handle clicking a notification item.');
assert.match(component, /router\.navigateByUrl/, 'Clicking a notification should redirect to the item destination.');
assert.match(component, /dismissedNotificationIds/, 'Clicked notifications should be removed from the list.');

assert.match(template, /notification-dropdown/, 'Topbar template should render a notification dropdown.');
assert.match(template, /notificationItems\(\)/, 'Topbar dropdown should render notification details.');
assert.match(template, /selectNotification\(notification\)/, 'Topbar notification items should be clickable.');
assert.match(template, /notification\.type === 'chat'/, 'Topbar dropdown should distinguish chat notifications.');
assert.match(template, /notification\.type === 'announcement'/, 'Topbar dropdown should distinguish announcement notifications.');

assert.match(styles, /\.notification-dropdown/, 'Topbar notification dropdown should have dedicated styling.');
