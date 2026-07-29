import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';

interface DocSection {
  title: string;
  content: string;
  /** Where in the app this section is talking about. */
  route?: string;
  routeLabel?: string;
}

/**
 * Product documentation.
 *
 * Everything this page used to render was a stub pointing at files that are not
 * in the repository:
 *
 *   - `assets/videos/getting-started.mp4` — no `assets/videos` directory exists,
 *     so the page rendered an empty <video> player stuck at 0:00.
 *   - `assets/images/docs/*.png` — no `assets/images/docs` directory exists, so
 *     all three "Screenshots" were broken-image icons showing their alt text.
 *   - `downloadPdf()` — an empty method behind a "Download PDF" button.
 *
 * The media references and the dead button are gone, and the two placeholder
 * blurbs (both of which trailed off in an ellipsis) are now real descriptions
 * of features that exist, each linking to the screen it describes.
 */
@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [RouterModule, FontAwesomeModule],
  templateUrl: './documentation.component.html'
})
export class DocumentationComponent {
  bookIcon = faBook;

  sections: DocSection[] = [
    {
      title: 'Getting started',
      content:
        'Start by adding a wallet for each account you hold — cash, current account, credit card, savings, and so on. Balances across the app are derived from your wallets, so the dashboard stays empty until at least one exists. Once a wallet is in place, record income and spending against it from Transactions, or bring history in wholesale from Import & Scan.',
      route: '/wallets',
      routeLabel: 'Go to Wallets'
    },
    {
      title: 'Managing multiple wallets',
      content:
        'Each wallet keeps its own type, currency and running balance. Use Transfer to move money between two wallets in one step — it debits the source and credits the destination together, so your total assets stay correct. Credit wallets hold what you owe and therefore carry a negative balance, which counts against your total.',
      route: '/wallets',
      routeLabel: 'Go to Wallets'
    },
    {
      title: 'Importing statements and receipts',
      content:
        'Import & Scan reads a .csv bank statement, CSV pasted as text, or bank SMS alerts pasted one per line. Always run "Preview (dry run)" first: it parses everything and reports what would be created, which rows look like duplicates and which it could not categorise, without writing anything. Set a default category to catch unmatched rows, or leave it empty to skip them.',
      route: '/import',
      routeLabel: 'Go to Import & Scan'
    },
    {
      title: 'Budgets, bills and the emergency fund',
      content:
        'A budget goal tracks progress towards a target amount by a target date. A bill is a recurring payment tracked by due date and marked Upcoming, Due Today, Overdue or Paid. A wallet typed as "emergency fund" gets a dedicated dashboard widget with its own target, monthly saving goal and balance history.',
      route: '/budget',
      routeLabel: 'Go to Product Budget'
    },
    {
      title: 'Currency and appearance',
      content:
        'The switcher in the header changes the display currency across the whole app, converting at current rates; ten currencies are supported. Each wallet keeps its own native currency, so only the presentation changes. The sun/moon button switches between light and dark, and follows your operating system until you pick one explicitly.',
      route: '/settings/profile',
      routeLabel: 'Go to Settings'
    }
  ];
}
