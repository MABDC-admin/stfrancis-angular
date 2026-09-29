import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const service = readFileSync('src/app/core/services/floating-chat.service.ts', 'utf8');
const template = readFileSync('src/app/shared/components/floating-chat/floating-chat.component.html', 'utf8');

assert.match(
  service,
  /staff-contacts/,
  'Floating chat service should load staff contacts for admin and teacher chat.',
);

assert.match(
  service,
  /conversations\/\$\{recipientId\}/,
  'Floating chat service should load a recipient-scoped conversation.',
);

assert.match(
  service,
  /recipientUserId/,
  'Floating chat service should send the selected recipient user id with messages.',
);

assert.match(
  service,
  /unread-count/,
  'Floating chat service should poll backend unread counts.',
);

assert.match(
  service,
  /test-broadcast/,
  'Floating chat service should expose the admin test broadcast endpoint.',
);

assert.match(
  service,
  /conversations\/\$\{conversationId\}\/read/,
  'Floating chat service should mark opened conversations as read.',
);

assert.match(
  template,
  /chat-contact-list/,
  'Floating chat UI should use a custom staff contact list so sender badges can render.',
);

assert.match(
  template,
  /contact\.unreadCount/,
  'Floating chat UI should show unread badges beside each staff sender.',
);

assert.doesNotMatch(
  template,
  /<select[\s\S]*selectedRecipientId/,
  'Floating chat UI should not use a native select for staff contacts because option rows cannot render badges.',
);

assert.match(
  template,
  /SFXSAI Support Desk/,
  'Floating chat UI should keep the support conversation available for broadcast messages.',
);

assert.match(
  template,
  /sendTestToAll/,
  'Floating chat UI should expose the admin test broadcast action.',
);

const styles = readFileSync('src/app/shared/components/floating-chat/floating-chat.component.scss', 'utf8');

assert.match(
  styles,
  /overflow-y:\s*auto/,
  'Floating chat messages should use a vertical scrollbar when content overflows.',
);

const topbar = readFileSync('src/app/layout/topbar/topbar.component.html', 'utf8');
const topbarComponent = readFileSync('src/app/layout/topbar/topbar.component.ts', 'utf8');

assert.match(
  topbarComponent,
  /chat\.unreadCount/,
  'Topbar notification bell should include unread chat messages in its badge.',
);

assert.match(
  topbar,
  /notificationCount\(\)/,
  'Topbar notification bell badge should render the combined notification count.',
);
