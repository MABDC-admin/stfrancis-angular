import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { io, Socket } from 'socket.io-client';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BackendBroadcastResult,
  BackendChatConversation,
  BackendUnreadCount,
  FloatingChatMessage,
  FloatingChatStaffContact,
  buildChatMessage,
  mapBackendConversationToFloatingMessages,
  normalizeChatMessages,
} from './floating-chat.util';

@Injectable({
  providedIn: 'root',
})
export class FloatingChatService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storageKey = 'sfxsai-floating-chat-messages-v1';
  private readonly channelName = 'sfxsai-floating-chat';
  private readonly apiUrl = `${environment.apiUrl}/chat`;
  private readonly channel = this.createBroadcastChannel();
  private readonly messagesSignal = signal<FloatingChatMessage[]>(this.loadMessages());
  private readonly contactsSignal = signal<FloatingChatStaffContact[]>([]);
  private readonly selectedRecipientIdSignal = signal('');
  private readonly activeConversationIdSignal = signal('');
  private readonly unreadCountSignal = signal(0);
  private readonly isOpenSignal = signal(false);
  private socket: Socket | null = null;

  readonly messages = this.messagesSignal.asReadonly();
  readonly contacts = this.contactsSignal.asReadonly();
  readonly selectedRecipientId = this.selectedRecipientIdSignal.asReadonly();
  readonly activeConversationId = this.activeConversationIdSignal.asReadonly();
  readonly selectedContact = computed(() => {
    const selectedId = this.selectedRecipientIdSignal();
    return this.contactsSignal().find(contact => contact.id === selectedId) ?? null;
  });
  readonly chatTitle = computed(() => this.selectedContact()?.displayName ?? 'Support Desk');
  readonly chatSubtitle = computed(() => {
    const contact = this.selectedContact();
    if (!contact) {
      return 'Online now';
    }

    return [contact.role, contact.assignedGradeLevel || contact.advisoryClass].filter(Boolean).join(' • ');
  });
  readonly isOpen = this.isOpenSignal.asReadonly();
  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly hasUnread = computed(() => this.unreadCount() > 0);
  readonly canBroadcastTest = computed(() => this.currentUser().role === 'ADMIN');

  constructor() {
    this.channel?.addEventListener('message', event => {
      if (event.data?.type === 'messages-updated') {
        this.messagesSignal.set(this.loadMessages());
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', event => {
        if (event.key === this.storageKey) {
          this.messagesSignal.set(this.loadMessages());
        }
      });
    }

    if (this.messagesSignal().length === 0) {
      this.replaceMessages([
        buildChatMessage({
          body: 'Hi. This is SFXSAI live chat. Send a message and the support desk will receive it instantly.',
          senderName: 'SFXSAI Support',
          senderRole: 'Online',
          source: 'system',
        }),
      ]);
    }

    this.loadStaffContacts();
    this.loadRemoteConversation();
    this.refreshUnreadCount();
    
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(auth => {
      if (auth?.token) {
        if (!this.socket) {
          this.connectSocket();
        }
      } else {
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
      }
    });
  }

  toggle(): void {
    this.isOpenSignal.update(value => {
      const next = !value;
      if (next) {
        window.setTimeout(() => this.markCurrentConversationRead(), 0);
      }
      return next;
    });
  }

  open(): void {
    this.isOpenSignal.set(true);
    this.markCurrentConversationRead();
  }

  close(): void {
    this.isOpenSignal.set(false);
  }

  selectRecipient(recipientId: string): void {
    if (recipientId === this.selectedRecipientIdSignal()) {
      return;
    }

    this.selectedRecipientIdSignal.set(recipientId);
    this.messagesSignal.set([]);
    this.activeConversationIdSignal.set('');
    this.loadRemoteConversation();
  }

  sendMessage(body: string): void {
    const user = this.currentUser();
    const message = buildChatMessage({
      body,
      senderName: user.name,
      senderRole: user.role,
      source: 'local',
    });

    this.replaceMessages([...this.messagesSignal(), message]);
    const recipientUserId = this.selectedRecipientIdSignal();
    const payload = recipientUserId ? { body, recipientUserId } : { body };

    this.http.post(`${this.apiUrl}/messages`, payload).subscribe({
      next: () => {
        this.loadRemoteConversation();
        this.refreshUnreadCount();
      },
      error: () => {
        const notice = buildChatMessage({
          body: 'Message saved locally while the chat server is unavailable.',
          senderName: 'SFXSAI Support',
          senderRole: 'Offline',
          source: 'system',
        });
        this.replaceMessages([...this.messagesSignal(), notice]);
      },
    });
  }

  sendTestMessageToAllUsers() {
    return this.http.post<BackendBroadcastResult>(`${this.apiUrl}/test-broadcast`, {}).pipe();
  }

  refreshUnreadCount(): void {
    if (!this.authService.getToken()) {
      this.unreadCountSignal.set(0);
      return;
    }

    this.http.get<BackendUnreadCount>(`${this.apiUrl}/unread-count`).subscribe({
      next: result => {
        this.unreadCountSignal.set(result.unreadCount ?? 0);
        this.loadStaffContacts();
      },
      error: () => undefined,
    });
  }

  private replaceMessages(messages: FloatingChatMessage[]): void {
    const normalized = normalizeChatMessages(messages).slice(-80);
    this.messagesSignal.set(normalized);
    this.persistMessages(normalized);
    this.channel?.postMessage({ type: 'messages-updated' });
  }

  private markCurrentConversationRead(): void {
    const conversationId = this.activeConversationIdSignal();
    if (!conversationId || !this.authService.getToken()) {
      return;
    }

    this.http.patch(`${this.apiUrl}/conversations/${conversationId}/read`, {}).subscribe({
      next: () => {
        this.refreshUnreadCount();
        this.loadStaffContacts();
      },
      error: () => undefined,
    });
  }

  private loadStaffContacts(): void {
    if (!this.authService.getToken()) {
      return;
    }

    this.http.get<FloatingChatStaffContact[]>(`${this.apiUrl}/staff-contacts`).subscribe({
      next: contacts => {
        this.contactsSignal.set(contacts);
      },
      error: () => this.contactsSignal.set([]),
    });
  }

  private loadMessages(): FloatingChatMessage[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? normalizeChatMessages(JSON.parse(stored) as FloatingChatMessage[]) : [];
    } catch {
      return [];
    }
  }

  private persistMessages(messages: FloatingChatMessage[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(messages));
  }

  private createBroadcastChannel(): BroadcastChannel | null {
    if (typeof BroadcastChannel === 'undefined') {
      return null;
    }

    return new BroadcastChannel(this.channelName);
  }

  private loadRemoteConversation(): void {
    if (!this.authService.getToken()) {
      return;
    }

    const recipientId = this.selectedRecipientIdSignal();
    const url = recipientId
      ? `${this.apiUrl}/conversations/${recipientId}`
      : `${this.apiUrl}/my-conversation`;

    this.http.get<BackendChatConversation>(url).subscribe({
      next: conversation => {
        this.activeConversationIdSignal.set(conversation.id);
        const user = this.currentUser();
        const mapped = mapBackendConversationToFloatingMessages(conversation, user.email);
        if (mapped.length > 0) {
          this.replaceMessages(mapped);
        }
        if (this.isOpenSignal()) {
          this.markCurrentConversationRead();
        } else {
          this.refreshUnreadCount();
        }
      },
      error: () => undefined,
    });
  }

  private connectSocket(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    const socketUrl = environment.production ? window.location.origin : environment.apiUrl;
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('chat-updated', () => {
      this.loadRemoteConversation();
      this.refreshUnreadCount();
      this.loadStaffContacts();
    });
  }

  private currentUser(): { name: string; email: string; role: string } {
    const rawUser = localStorage.getItem('user');

    if (rawUser) {
      try {
        const user = JSON.parse(rawUser) as { email?: string; name?: string; firstName?: string; lastName?: string; role?: string };
        const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ');
        return {
          name: name || user.email || 'SFXSAI User',
          email: user.email || '',
          role: user.role || 'User',
        };
      } catch {
        return { name: 'SFXSAI User', email: '', role: this.authService.getUserRole() || 'User' };
      }
    }

    return { name: 'SFXSAI User', email: '', role: this.authService.getUserRole() || 'User' };
  }
}
