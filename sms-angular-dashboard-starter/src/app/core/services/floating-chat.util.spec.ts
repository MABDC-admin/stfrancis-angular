import assert from 'node:assert/strict';
import {
  buildChatMessage,
  calculateUnreadCount,
  normalizeChatMessages,
} from './floating-chat.util';

const fixedNow = new Date('2026-06-14T10:15:00Z');

const message = buildChatMessage({
  body: '  Need help with enrollment status.  ',
  senderName: 'Rene',
  senderRole: 'Finance',
  source: 'local',
  now: fixedNow,
});

assert.equal(message.body, 'Need help with enrollment status.');
assert.equal(message.senderName, 'Rene');
assert.equal(message.senderRole, 'Finance');
assert.equal(message.source, 'local');
assert.equal(message.sentAt, fixedNow.toISOString());
assert.ok(message.id.startsWith('chat-'));

assert.throws(() =>
  buildChatMessage({
    body: '   ',
    senderName: 'Rene',
    senderRole: 'Finance',
    source: 'local',
    now: fixedNow,
  }),
);

const normalized = normalizeChatMessages([
  message,
  {
    id: 'missing-body',
    body: '',
    senderName: 'Support',
    senderRole: 'System',
    source: 'remote',
    sentAt: fixedNow.toISOString(),
  },
  {
    id: 'old-message',
    body: 'Earlier note',
    senderName: 'Support',
    senderRole: 'System',
    source: 'remote',
    sentAt: '2026-06-13T09:00:00Z',
  },
]);

assert.equal(normalized.length, 2);
assert.equal(normalized[0].id, 'old-message');
assert.equal(normalized[1].id, message.id);
assert.equal(calculateUnreadCount(normalized, false), 1);
assert.equal(calculateUnreadCount(normalized, true), 0);
