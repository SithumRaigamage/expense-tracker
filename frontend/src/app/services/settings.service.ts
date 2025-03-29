import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { User } from '../models/User';
import { faCcVisa, faCcMastercard } from '@fortawesome/free-brands-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { catchError } from 'rxjs/operators';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
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

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private dummyUser: User = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    name: 'John Doe',
    phone: '+1234567890',
    bio: 'Software Developer',
    preferredCurrency: 'USD',
    role: 'Software Engineer',
    location: 'Colombo, Sri Lanka',
    profileImage: 'assets/images/user/owner.png'
  };

  private dummyPaymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'visa',
      lastFour: '4242',
      expiryMonth: 12,
      expiryYear: 24,
      isDefault: true
    },
    {
      id: '2',
      type: 'mastercard',
      lastFour: '5555',
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

  private availableCurrencies: Currency[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }
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
    return of(this.availableCurrencies);
  }

  updateCurrency(currencyCode: string): Observable<void> {
    return new Observable<void>(observer => {
      setTimeout(() => {
        this.dummyUser.preferredCurrency = currencyCode;
        observer.next(void 0);
        observer.complete();
      }, 500);
    }).pipe(
      catchError(error => {
        console.error('Error updating currency:', error);
        return throwError(() => new Error('Failed to update currency'));
      })
    );
  }
}
