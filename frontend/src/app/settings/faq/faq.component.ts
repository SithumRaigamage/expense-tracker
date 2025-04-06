import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';

interface FaqItem {
  category: string;
  question: string;
  answer: string;
  isOpen?: boolean;
  helpfulVotes?: number;
  unhelpfulVotes?: number;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './faq.component.html'
})
export class FaqComponent {
  searchTerm = '';
  selectedCategory = 'all';
  thumbsUpIcon = faThumbsUp;
  thumbsDownIcon = faThumbsDown;

  categories = [
    'Getting Started',
    'Wallet Management',
    'Transactions',
    'Budgeting',
    'Account Settings'
  ];

  faqs: FaqItem[] = [
    {
      category: 'Getting Started',
      question: 'How do I add my first wallet?',
      answer: 'Navigate to the Wallets section from the sidebar, click the "+" button, and fill in your wallet details.',
      helpfulVotes: 24,
      unhelpfulVotes: 2
    },
    // Add more FAQs
  ];

  get filteredFaqs() {
    return this.faqs.filter(faq =>
      (this.selectedCategory === 'all' || faq.category === this.selectedCategory) &&
      (faq.question.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
       faq.answer.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  voteFaq(faq: FaqItem, helpful: boolean) {
    if (helpful) {
      faq.helpfulVotes = (faq.helpfulVotes || 0) + 1;
    } else {
      faq.unhelpfulVotes = (faq.unhelpfulVotes || 0) + 1;
    }
  }
}
