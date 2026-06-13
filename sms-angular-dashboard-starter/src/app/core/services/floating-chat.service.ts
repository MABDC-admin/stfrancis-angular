import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import {
  FloatingChatMessage,
  buildChatMessage,
  calculateUnreadCount,
  normalizeChatMessages,
} from './floating-chat.util';

@Injectable({
  providedIn: 'root',
})
export class FloatingChatService {
  private readonly authService = inject(AuthService);
  private readonly storageKey = 'sfxsai-floating-chat-messages-v1';
  private readonly channelName = 'sfxsai-floating-chat';
  private readonly channel = this.createBroadcastChannel();
  private readonly messagesSignal = signal<FloatingChatMessage[]>(this.loadMessages());
  private readonly isOpenSignal = signal(false);

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
    this.queueSupportReply(body);
  }

  private queueSupportReply(body: string): void {
    window.setTimeout(() => {
      const reply = buildChatMessage({
        body: this.buildSupportReply(body),
        senderName: 'SFXSAI Support',
        senderRole: 'Online',
        source: 'remote',
      });

      this.replaceMessages([...this.messagesSignal(), reply]);
    }, 650);
  }

  private buildSupportReply(body: string): string {
    const lowered = body.toLowerCase();

    if (lowered.includes('payment') || lowered.includes('billing') || lowered.includes('finance')) {
      return 'Finance support received this. Please include the learner name or receipt number so it can be checked against the current school year.';
    }

    if (lowered.includes('enroll') || lowered.includes('registrar')) {
      return 'Registrar support received this. Please include the learner name and grade level so the record can be located faster.';
    }

    return 'Message received. The support desk has this conversation open.';
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

  private currentUser(): { name: string; role: string } {
    const rawUser = localStorage.getItem('user');

    if (rawUser) {
      try {
        const user = JSON.parse(rawUser) as { name?: string; firstName?: string; lastName?: string; role?: string };
        const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ');
        return {
          name: name || 'SFXSAI User',
          role: user.role || 'User',
        };
      } catch {
        return { name: 'SFXSAI User', role: this.authService.getUserRole() || 'User' };
      }
    }

    return { name: 'SFXSAI User', role: this.authService.getUserRole() || 'User' };
  }
}
