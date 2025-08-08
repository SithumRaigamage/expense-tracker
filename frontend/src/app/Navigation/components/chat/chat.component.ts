import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: Source[];
  isLoading?: boolean;
  error?: string;
}

interface Source {
  title: string;
  snippet: string;
  url: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  messages: ChatMessage[] = [
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
      sources: [
        {
          title: 'Sample Documentation',
          snippet: 'This is a sample context snippet...',
          url: 'https://example.com'
        }
      ]
    }
  ];

  userInput = '';
  isLoading = false;
  temperature = 0.7;
  maxTokens = 1000;
  isDarkMode = false;

  async sendMessage() {
    if (!this.userInput.trim()) return;

    // Add user message
    this.messages.push({
      id: Date.now().toString(),
      content: this.userInput,
      role: 'user',
      timestamp: new Date()
    });

    // Simulate AI response
    this.messages.push({
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true
    });

    // Clear input
    this.userInput = '';

    // Simulate API delay
    setTimeout(() => {
      const lastMessage = this.messages[this.messages.length - 1];
      lastMessage.isLoading = false;
      lastMessage.content = 'This is a simulated AI response...';
      lastMessage.sources = [
        {
          title: 'Documentation',
          snippet: 'Relevant context...',
          url: 'https://example.com'
        }
      ];
    }, 2000);
  }

  clearChat() {
    this.messages = [];
  }

  copyMessage(message: ChatMessage) {
    navigator.clipboard.writeText(message.content);
  }

  regenerateResponse() {
    if (this.messages.length > 0) {
      const lastMessage = this.messages[this.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        lastMessage.isLoading = true;
        setTimeout(() => {
          lastMessage.isLoading = false;
          lastMessage.content = 'This is a regenerated response...';
        }, 2000);
      }
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
  }
}
