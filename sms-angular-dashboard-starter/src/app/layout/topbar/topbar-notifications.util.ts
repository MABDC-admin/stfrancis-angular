export type TopbarNotificationType = 'chat' | 'announcement';

export interface TopbarNotification {
  id: string;
  type: TopbarNotificationType;
  title: string;
  detail: string;
  count: number;
  destination: string;
}

export interface TopbarNotificationInput {
  role?: string;
  portal?: string;
  chatUnreadCount: number;
  announcementCount: number;
  dismissedIds: string[];
}

export function buildTopbarNotifications(input: TopbarNotificationInput): TopbarNotification[] {
  const role = (input.role || '').toUpperCase();
  const portal = input.portal || role.toLowerCase() || 'admin';
  const dismissed = new Set(input.dismissedIds);
  const items: TopbarNotification[] = [];

  if (input.chatUnreadCount > 0) {
    items.push({
      id: `chat-${role || portal}-${input.chatUnreadCount}`,
      type: 'chat',
      title: `${input.chatUnreadCount} unread chat message${input.chatUnreadCount === 1 ? '' : 's'}`,
      detail: 'Open the messaging area to review new conversations.',
      count: input.chatUnreadCount,
      destination: notificationDestination('chat', role, portal),
    });
  }

  if (input.announcementCount > 0) {
    items.push({
      id: `announcement-${role || portal}-${input.announcementCount}`,
      type: 'announcement',
      title: `${input.announcementCount} announcement${input.announcementCount === 1 ? '' : 's'}`,
      detail: role === 'FINANCE'
        ? 'New learner assessment notices need finance review.'
        : 'Open announcements to review posted notices.',
      count: input.announcementCount,
      destination: notificationDestination('announcement', role, portal),
    });
  }

  return items.filter(item => !dismissed.has(item.id));
}

export function dismissTopbarNotification(currentIds: string[], id: string): string[] {
  return Array.from(new Set([...currentIds, id]));
}

export function notificationDestination(type: TopbarNotificationType, role = '', portal = ''): string {
  const normalizedRole = role.toUpperCase();
  const normalizedPortal = portal || normalizedRole.toLowerCase() || 'admin';

  if (type === 'chat') {
    if (normalizedRole === 'TEACHER') return '/teacher/messages';
    if (normalizedRole === 'STUDENT') return '/student/messages';
    if (normalizedRole === 'PRINCIPAL') return '/principal/messages';
    return `/${normalizedPortal}/dashboard`;
  }

  if (normalizedRole === 'TEACHER') return '/teacher/announcements';
  if (normalizedRole === 'STUDENT') return '/student/announcements';
  if (normalizedRole === 'PRINCIPAL') return '/principal/announcements';
  if (normalizedRole === 'FINANCE') return `/${normalizedPortal}/billing-assessment`;
  return `/${normalizedPortal}/dashboard`;
}
