import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  BackendChatConversation,
  FloatingChatMessage,
  buildChatMessage,
  calculateUnreadCount,
  mapBackendConversationToFloatingMessages,
  normalizeChatMessages,
} from './floating-chat.util';

@Injectable({
  providedIn: 'root',
})
export class FloatingChatService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'sfxsai-floating-chat-messages-v1';
  private readonly channelName = 'sfxsai-floating-chat';
  private readonly apiUrl = `${environment.apiUrl}/chat`;
  private readonly channel = this.createBroadcastChannel();
  private readonly messagesSignal = signal<FloatingChatMessage[]>(this.loadMessages());
  private readonly isOpenSignal = signal(false);
  private pollHandle: number | null = null;

  readonly messages = this.messagesSignal.asReadonly();
  readonly isOpen = this.isOpenSignal.asReadonly();
  readonly unreadCount = computed(() => calculateUnreadCount(this.messagesSignal(), this.isOpenSignal()));
  readonly hasUnread = computed(() => this.unreadCount() > 0);

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

    this.loadRemoteConversation();
    this.startPolling();
  }

  toggle(): void {
    this.isOpenSignal.update(value => !value);
  }

  open(): void {
    this.isOpenSignal.set(true);
  }

  close(): void {
    this.isOpenSignal.set(false);
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
    this.http.post(`${this.apiUrl}/messages`, { body }).subscribe({
      next: () => this.loadRemoteConversation(),
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

  private replaceMessages(messages: FloatingChatMessage[]): void {
    const normalized = normalizeChatMessages(messages).slice(-80);
    this.messagesSignal.set(normalized);
    this.persistMessages(normalized);
    this.channel?.postMessage({ type: 'messages-updated' });
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

    this.http.get<BackendChatConversation>(`${this.apiUrl}/my-conversation`).subscribe({
      next: conversation => {
        const user = this.currentUser();
        const mapped = mapBackendConversationToFloatingMessages(conversation, user.email);
        if (mapped.length > 0) {
          this.replaceMessages(mapped);
        }
      },
      error: () => undefined,
    });
  }

  private startPolling(): void {
    if (typeof window === 'undefined' || this.pollHandle !== null) {
      return;
    }

    this.pollHandle = window.setInterval(() => this.loadRemoteConversation(), 5000);
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
