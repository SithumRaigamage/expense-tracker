import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faThumbsUp, faThumbsDown, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

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
  imports: [FormsModule, FontAwesomeModule, EmptyStateComponent],
  templateUrl: './faq.component.html'
})
export class FaqComponent {
  searchTerm = '';
  selectedCategory = 'all';
  thumbsUpIcon = faThumbsUp;
  thumbsDownIcon = faThumbsDown;
  readonly faCircleQuestion = faCircleQuestion;

  categories = [
    'Getting Started',
    'Wallet Management',
    'Transactions',
    'Budgeting',
    'Account Settings'
  ];

  /*
    Every answer below describes behaviour this build actually has — the wallet
    types the form accepts, the ten currencies the currency service supports,
    the dry-run the import endpoint exposes, and so on. Nothing here promises a
    feature that does not exist yet; where something is genuinely unavailable
    (password reset, for one) the answer says so rather than inventing a flow.

    The vote counts start at zero because nobody has voted; the previous single
    entry shipped with a hardcoded "24 helpful / 2 unhelpful".
  */
  faqs: FaqItem[] = [
    {
      category: 'Getting Started',
      question: 'How do I add my first wallet?',
      answer:
        'Open Wallets from the sidebar and choose "Add Wallet". Give it a name, pick a type — cash, bank, credit, savings, crypto, investment, loan or emergency fund — and set its starting balance and currency. Every balance you see on the dashboard is derived from your wallets, so this is the first thing worth doing.'
    },
    {
      category: 'Getting Started',
      question: 'What does the dashboard actually show me?',
      answer:
        'A balance card per account type, an income-versus-expenses trend you can view monthly, quarterly, annually or as a trend line, a flow chart tracing income through your wallets and out to categories, plus recent transactions, budget goals, upcoming bills and your emergency fund. Use "Customize" at the bottom-right to hide any widget you do not want.'
    },
    {
      category: 'Getting Started',
      question: 'Can I change which widgets appear on the dashboard?',
      answer:
        'Yes. The "Customize" button at the bottom-right of the dashboard opens a panel listing every widget with a visibility toggle. Your choice is remembered, and "Reset to Default" restores the original set.'
    },
    {
      category: 'Wallet Management',
      question: 'How do I move money between two wallets?',
      answer:
        'Use "Transfer" in the Wallets header, or the Transfer action on any individual wallet card. Pick the source and destination wallets and an amount — the transfer debits one and credits the other in a single step, so your total assets stay correct.'
    },
    {
      category: 'Wallet Management',
      question: 'What is the emergency fund wallet for?',
      answer:
        'A wallet with the "emergency fund" type gets its own dashboard widget tracking balance, target goal, monthly saving goal and progress, along with a balance history chart. Create one and set a target with "Edit targets" on that widget; until you set a target it reports "No target goal set" rather than inventing one.'
    },
    {
      category: 'Wallet Management',
      question: 'Why is my credit card balance negative?',
      answer:
        'Credit wallets hold what you owe, so the balance is shown as a negative number and reduces your total assets. That is expected — it keeps the total on the Wallets page an honest picture of your net position.'
    },
    {
      category: 'Transactions',
      question: 'Can I import transactions instead of typing them in?',
      answer:
        'Yes — Import & Scan handles three sources: a .csv bank statement, CSV pasted as text, and bank SMS alerts pasted one per line. Run "Preview (dry run)" first: it parses everything and shows you what would be created, including duplicates and rows it could not match, without saving anything.'
    },
    {
      category: 'Transactions',
      question: 'What happens to rows the importer cannot categorise?',
      answer:
        'They are reported as "unmatched". You can set a default category on the import screen and they will be filed under it, or leave the default empty and unmatched rows are skipped instead of being guessed at.'
    },
    {
      category: 'Transactions',
      question: 'Can I scan a paper receipt?',
      answer:
        'The Receipt scan tab accepts a photo and reads the merchant, amount and date from it, then lets you correct anything before saving. Text extraction needs an OCR key configured on the server; without one the receipt is still stored and you fill the fields in yourself.'
    },
    {
      category: 'Transactions',
      question: 'How do I get my data out?',
      answer:
        'Wallets, Transactions and Bills each have an "Export" button that downloads the current list as an Excel file. Exports respect the filters you have applied, so you can narrow a date range or category first and export just that.'
    },
    {
      category: 'Budgeting',
      question: 'What is the difference between a budget goal and a bill?',
      answer:
        'A budget goal is something you are saving towards — a target amount, a target date and the progress you have made. A bill is a recurring payment you owe, tracked by due date and marked Upcoming, Due Today, Overdue or Paid. Goals live under Product Budget; bills live under Bills.'
    },
    {
      category: 'Budgeting',
      question: 'How is progress on a goal calculated?',
      answer:
        'Progress is the amount saved against the target amount, shown as a percentage with a colour that shifts as you approach the target. "Remaining" is simply the target minus what you have put aside so far.'
    },
    {
      category: 'Account Settings',
      question: 'Can I use a currency other than the one I signed up with?',
      answer:
        'The switcher in the header changes the display currency across the whole app, converting at current exchange rates. Ten are supported: USD, LKR, EUR, GBP, JPY, CAD, AUD, CHF, CNY and INR. Each wallet keeps its own native currency — only the presentation changes, so nothing is rewritten in your data.'
    },
    {
      category: 'Account Settings',
      question: 'How do I switch between light and dark mode?',
      answer:
        'The sun/moon button in the header toggles it, and your choice is remembered on this device. If you have never chosen, the app follows your operating system setting and keeps following it when that changes.'
    },
    {
      category: 'Account Settings',
      question: 'I forgot my password — how do I reset it?',
      answer:
        'There is no self-service password reset in this version. If you are still signed in you can change your password under Settings → Profile, which asks for your current password first. If you are locked out entirely, contact support so an administrator can help.'
    }
  ];

  get filteredFaqs() {
    return this.faqs.filter(faq =>
      (this.selectedCategory === 'all' || faq.category === this.selectedCategory) &&
      (faq.question.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
       faq.answer.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  /**
   * The entries belonging to one category, after search and category filters.
   *
   * The template looped over `filteredFaqs` *inside* each category heading, so
   * every question was rendered under every heading — the single seeded entry
   * appeared five times, once per category.
   */
  faqsFor(category: string): FaqItem[] {
    return this.filteredFaqs.filter(faq => faq.category === category);
  }

  /** Categories with at least one matching entry, so empty headings are hidden. */
  get visibleCategories(): string[] {
    return this.categories.filter(category => this.faqsFor(category).length > 0);
  }

  /** True when a search or filter has excluded everything. */
  get hasNoResults(): boolean {
    return this.filteredFaqs.length === 0;
  }

  voteFaq(faq: FaqItem, helpful: boolean) {
    if (helpful) {
      faq.helpfulVotes = (faq.helpfulVotes || 0) + 1;
    } else {
      faq.unhelpfulVotes = (faq.unhelpfulVotes || 0) + 1;
    }
  }
}
