import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { User } from '../core/models/User';
import { faCcVisa, faCcMastercard } from '@fortawesome/free-brands-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { catchError } from 'rxjs/operators';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard';
  cardNumber: string; // Changed from lastFour to full cardNumber
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface CardImage {
  visa: string;
  mastercard: string;
}

export interface CardIcon {
  visa: IconDefinition;
  mastercard: IconDefinition;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface SupportLink {
  title: string;
  url: string;
  icon: string;
}

export interface FAQ {
  question: string;
  answer: string;
  isOpen?: boolean; // Add optional isOpen property
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private dummyUser: User = {
    name: 'Sithum Raigamage',
    firstName: 'Sithum',
    lastName: 'Raigamage',
    role: 'Software Engineer',
    location: 'Colombo, Sri Lanka',
    profileImage: 'assets/images/user/owner.png',
    email: 'sraig2002@gmail.com',
    phone: '+94 77 123 4567',
    bio: 'Enthusiastic software engineering intern with a passion for web development and new technologies. Currently learning Angular and TypeScript while contributing to full-stack projects.'
  };

  private dummyPaymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'visa',
      cardNumber: '4242424242424242', // Full card number
      expiryMonth: 12,
      expiryYear: 24,
      isDefault: true
    },
    {
      id: '2',
      type: 'mastercard',
      cardNumber: '5555555555554444', // Full card number
      expiryMonth: 9,
      expiryYear: 25,
      isDefault: false
    }
  ];

  private cardImages: CardImage = {
    visa: 'assets/images/cards/visa.svg',
    mastercard: 'assets/images/cards/mastercard.svg'
  };

  private cardIcons: CardIcon = {
    visa: faCcVisa,
    mastercard: faCcMastercard
  };

  private currencies: Currency[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' }
  ];

  private supportLinks: SupportLink[] = [
    {
      title: 'Documentation',
      url: '',
      icon: 'book'
    },
    {
      title: 'Contact Support',
      url: '',
      icon: 'envelope'
    }
  ];

  private faqs: FAQ[] = [
    {
      question: 'How do I add a new wallet?',
      answer: 'Go to the Wallets section and click the "Add New" button. Fill in the required details and save.'
    },
    {
      question: 'How do I export my transactions?',
      answer: 'Navigate to the Transactions page, click "Export" and choose your preferred format (CSV or PDF).'
    }
  ];

  getUserProfile(): Observable<User> {
    return of(this.dummyUser);
  }

  updateUserProfile(userData: User): Observable<User> {
    // Simulate API call
    this.dummyUser = { ...userData };
    return of(this.dummyUser);
  }

  updateUserProfileWithImage(formData: FormData): Observable<User> {
    // For demo purposes, we'll simulate the image upload
    return new Observable(observer => {
      setTimeout(() => {
        const imageUrl = URL.createObjectURL(formData.get('profileImage') as Blob);
        const updatedUser = {
          ...this.dummyUser,
          profileImage: imageUrl
        };
        this.dummyUser = updatedUser;
        observer.next(updatedUser);
        observer.complete();
      }, 1000);
    });
  }

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return of(this.dummyPaymentMethods);
  }

  addPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id'>): Observable<PaymentMethod> {
    const newPaymentMethod = {
      ...paymentMethod,
      id: Math.random().toString(36).substr(2, 9)
    };
    this.dummyPaymentMethods.push(newPaymentMethod);
    return of(newPaymentMethod).pipe(
      catchError(error => {
        console.error('Error adding payment method:', error);
        return throwError(() => new Error('Failed to add payment method'));
      })
    );
  }

  updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): Observable<PaymentMethod> {
    const index = this.dummyPaymentMethods.findIndex(pm => pm.id === id);
    if (index === -1) {
      throw new Error('Payment method not found');
    }
    this.dummyPaymentMethods[index] = { ...this.dummyPaymentMethods[index], ...updates };
    return of(this.dummyPaymentMethods[index]).pipe(
      catchError(error => {
        console.error('Error updating payment method:', error);
        return throwError(() => new Error('Failed to update payment method'));
      })
    );
  }

  deletePaymentMethod(id: string): Observable<void> {
    const index = this.dummyPaymentMethods.findIndex(pm => pm.id === id);
    if (index === -1) {
      throw new Error('Payment method not found');
    }
    this.dummyPaymentMethods.splice(index, 1);
    return of(void 0).pipe(
      catchError(error => {
        console.error('Error deleting payment method:', error);
        return throwError(() => new Error('Failed to delete payment method'));
      })
    );
  }

  getCardImage(type: 'visa' | 'mastercard'): string {
    return this.cardImages[type];
  }

  getCardIcon(type: 'visa' | 'mastercard'): IconDefinition {
    return this.cardIcons[type];
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    // Simulate API call
    return new Observable<void>(observer => {
      setTimeout(() => {
        // Simulate password validation
        if (currentPassword === 'wrong-password') {
          observer.error(new Error('Current password is incorrect'));
          return;
        }

        // In a real application, you would make an API call here
        observer.next(void 0);
        observer.complete();
      }, 1000);
    }).pipe(
      catchError(error => {
        console.error('Error changing password:', error);
        return throwError(() => new Error('Failed to change password'));
      })
    );
  }

  changeEmail(newEmail: string, password: string): Observable<void> {
    // Simulate API call
    return new Observable<void>(observer => {
      setTimeout(() => {
        // Simulate password validation
        if (password === 'wrong-password') {
          observer.error(new Error('Invalid password'));
          return;
        }

        this.dummyUser.email = newEmail;
        observer.next(void 0);
        observer.complete();
      }, 1000);
    }).pipe(
      catchError(error => {
        console.error('Error changing email:', error);
        return throwError(() => new Error('Failed to change email'));
      })
    );
  }

  getCurrencies(): Observable<Currency[]> {
    return of(this.currencies);
  }

  updateCurrency(currencyCode: string): Observable<void> {
    // Simulate API call
    return new Observable<void>(observer => {
      setTimeout(() => {
        // In a real app, you would update the user's currency preference
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  getSupportLinks(): Observable<SupportLink[]> {
    return of(this.supportLinks);
  }

  getFAQs(): Observable<FAQ[]> {
    return of(this.faqs);
  }
}
