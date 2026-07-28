import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatTurn } from '../../../services/chat.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

/**
 * Assistant grounded in the signed-in user's own finances.
 *
 * This used to answer every question with "This is a simulated AI response..."
 * after a two-second timer. It talks to the real model through the backend
 * proxy now — the API key stays server-side, and the server attaches the
 * user's balances, spending and goals so answers are about their money rather
 * than personal finance in the abstract.
 */
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  messages: ChatMessage[] = [];
  userInput = '';
  isLoading = false;
  /** False when the server has no API key; the composer explains rather than failing. */
  isAvailable = true;

  private controller: AbortController | null = null;

  ngOnInit(): void {
    this.chatService.isAvailable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(available => {
        this.isAvailable = available;
      });
  }

  async sendMessage(): Promise<void> {
    const text = this.userInput.trim();
    if (!text || this.isLoading || !this.isAvailable) {
      return;
    }

    this.messages.push({
      id: `${Date.now()}-user`,
      content: text,
      role: 'user',
      timestamp: new Date()
    });
    this.userInput = '';

    const reply: ChatMessage = {
      id: `${Date.now()}-assistant`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true
    };
    this.messages.push(reply);
    this.isLoading = true;

    // Only user/assistant text goes back — the server rebuilds the financial
    // context itself so it is always current, never replayed from the client.
    const history: ChatTurn[] = this.messages
      .filter(m => !m.isStreaming || m !== reply)
      .filter(m => m.content.trim())
      .map(m => ({ role: m.role, content: m.content }));

    this.controller = new AbortController();

    try {
      for await (const event of this.chatService.send(history, this.controller.signal)) {
        if (event.type === 'delta') {
          reply.content += event.text;
        } else if (event.type === 'error') {
          this.notifications.error(event.message);
        }
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        this.notifications.error('The assistant stopped unexpectedly.');
      }
    } finally {
      reply.isStreaming = false;
      this.isLoading = false;
      this.controller = null;

      // An empty bubble reads as a bug; drop it and let the toast explain.
      if (!reply.content.trim()) {
        this.messages = this.messages.filter(m => m !== reply);
      }
    }
  }

  /** Stops generation without discarding what has already arrived. */
  stop(): void {
    this.controller?.abort();
  }

  clearChat(): void {
    this.stop();
    this.messages = [];
  }

  copyMessage(message: ChatMessage): void {
    navigator.clipboard.writeText(message.content).then(
      () => this.notifications.success('Copied.'),
      () => this.notifications.error('Could not copy that message.')
    );
  }
}
