export type ChatMessageSource = 'local' | 'remote' | 'system';

export interface FloatingChatMessage {
  id: string;
  body: string;
  senderName: string;
  senderRole: string;
  source: ChatMessageSource;
  sentAt: string;
}

export interface BuildChatMessageInput {
  body: string;
  senderName: string;
  senderRole: string;
  source: ChatMessageSource;
  now?: Date;
}

export function buildChatMessage(input: BuildChatMessageInput): FloatingChatMessage {
  const body = input.body.trim();

  if (!body) {
    throw new Error('Message body is required.');
  }

  const now = input.now ?? new Date();

  return {
    id: `chat-${now.getTime()}-${Math.random().toString(36).slice(2, 9)}`,
    body,
    senderName: input.senderName.trim() || 'SFXSAI User',
    senderRole: input.senderRole.trim() || 'User',
    source: input.source,
    sentAt: now.toISOString(),
  };
}

export function normalizeChatMessages(messages: FloatingChatMessage[]): FloatingChatMessage[] {
  return messages
    .filter(message => Boolean(message.id && message.body?.trim() && message.sentAt))
    .map(message => ({ ...message, body: message.body.trim() }))
    .sort((left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime());
}

export function calculateUnreadCount(messages: FloatingChatMessage[], isOpen: boolean): number {
  if (isOpen) {
    return 0;
  }

  return messages.filter(message => message.source === 'remote' || message.source === 'system').length;
}
