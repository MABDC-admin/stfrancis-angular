import assert from 'node:assert/strict';
import {
  buildChatMessage,
  calculateUnreadCount,
  mapBackendConversationToFloatingMessages,
  normalizeChatMessages,
} from './floating-chat.util.ts';

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

const mapped = mapBackendConversationToFloatingMessages(
  {
    id: 'conversation-1',
    messages: [
      {
        id: 'server-msg-1',
        body: 'Backend persisted note',
        senderName: 'teacher1@sfxsai.com',
        senderRole: 'TEACHER',
        source: 'USER',
        createdAt: '2026-06-14T11:00:00.000Z',
      },
      {
        id: 'server-msg-2',
        body: 'Support reply',
        senderName: 'SFXSAI Support',
        senderRole: 'Online',
        source: 'SUPPORT',
        createdAt: '2026-06-14T11:01:00.000Z',
      },
    ],
  },
  'teacher1@sfxsai.com',
);

assert.equal(mapped[0].source, 'local');
assert.equal(mapped[0].sentAt, '2026-06-14T11:00:00.000Z');
assert.equal(mapped[1].source, 'remote');
