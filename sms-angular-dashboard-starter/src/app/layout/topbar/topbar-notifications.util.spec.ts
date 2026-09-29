import assert from 'node:assert/strict';
import {
  buildTopbarNotifications,
  dismissTopbarNotification,
  notificationDestination,
} from './topbar-notifications.util.ts';

const teacherNotifications = buildTopbarNotifications({
  role: 'TEACHER',
  portal: 'teacher',
  chatUnreadCount: 3,
  announcementCount: 2,
  dismissedIds: [],
});

assert.deepEqual(
  teacherNotifications.map(item => item.type),
  ['chat', 'announcement'],
  'Topbar notifications should distinguish chat and announcement types.',
);

assert.equal(teacherNotifications[0].count, 3, 'Chat notification should carry unread chat count.');
assert.equal(teacherNotifications[1].count, 2, 'Announcement notification should carry announcement count.');
assert.equal(teacherNotifications[0].destination, '/teacher/messages', 'Teacher chat notifications should open Messages.');
assert.equal(teacherNotifications[1].destination, '/teacher/announcements', 'Teacher announcement notifications should open Announcements.');

assert.equal(
  notificationDestination('chat', 'PRINCIPAL', 'principal'),
  '/principal/messages',
  'Principal chat notification should open the principal messaging hub.',
);

assert.equal(
  notificationDestination('announcement', 'FINANCE', 'registrar-finance'),
  '/registrar-finance/billing-assessment',
  'Finance announcement notification should open billing assessment queue.',
);

const dismissed = dismissTopbarNotification([], teacherNotifications[0].id);
assert.deepEqual(dismissed, [teacherNotifications[0].id], 'Dismiss should store the clicked notification id.');

const afterDismiss = buildTopbarNotifications({
  role: 'TEACHER',
  portal: 'teacher',
  chatUnreadCount: 3,
  announcementCount: 2,
  dismissedIds: dismissed,
});

assert.deepEqual(
  afterDismiss.map(item => item.type),
  ['announcement'],
  'Clicked notifications should disappear from the rendered notification list.',
);
