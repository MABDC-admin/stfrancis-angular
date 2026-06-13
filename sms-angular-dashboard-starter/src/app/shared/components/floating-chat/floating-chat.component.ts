import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FloatingChatService } from '../../../core/services/floating-chat.service';

@Component({
  selector: 'app-floating-chat',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, NgClass],
  templateUrl: './floating-chat.component.html',
  styleUrl: './floating-chat.component.scss',
})
export class FloatingChatComponent {
  readonly chat = inject(FloatingChatService);
  readonly error = signal('');
  draftText = '';

  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLTextAreaElement>;

  constructor() {
    effect(() => {
      this.chat.messages();
      this.chat.isOpen();
      window.setTimeout(() => this.scrollToLatest(), 0);
    });
  }

  send(): void {
    const value = this.draftText.trim();

    if (!value) {
      this.error.set('Type a message first.');
      return;
    }

    this.chat.sendMessage(value);
    this.draftText = '';
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.value = '';
    }
    this.error.set('');
  }

  onInput(value: string): void {
    this.draftText = value;
    if (value.trim()) {
      this.error.set('');
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }

    if (event.key === 'Escape') {
      this.chat.close();
    }
  }

  formatTime(value: string): string {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  private scrollToLatest(): void {
    const element = this.messageList?.nativeElement;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }
}
