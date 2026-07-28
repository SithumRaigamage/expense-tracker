import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User } from '../core/models/User';
import { faCcVisa, faCcMastercard } from '@fortawesome/free-brands-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { environment } from '../../environments/environment';
import { toUserMessage } from '../core/utils/http-error';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard';
  cardNumber: string;
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
  isOpen?: boolean;
}

/** Standard backend envelope. Declared locally, as in the other services. */
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** What /users/profile returns: a User, plus the avatar alias the app maps over. */
type ApiUser = Partial<User> & { avatar?: string };

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;
  private user: User | null = null;

  /**
   * Fill in the fields the backend leaves out. The API sends the avatar under
   * either `profileImage` or `avatar`, and may send only a combined `name` —
   * both profile endpoints normalised this the same way, so it lives here now.
   */
  private static toUser(source: ApiUser, imageOverride?: string): User {
    const name = source.name || '';
    const parts = name.split(' ');

    return {
      ...source,
      name,
      email: source.email || '',
      profileImage: imageOverride || source.profileImage || source.avatar || '',
      firstName: source.firstName || parts[0] || '',
      lastName: source.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : '')
    };
  }

  // Method to check if the server is reachable
  checkServerConnection(): Observable<{ status?: string }> {
    return this.http.get<{ status?: string }>(`${this.apiUrl}/health`).pipe(
      tap(response => console.log('Backend server is reachable:', response)),
      catchError(error => {
        console.error('Backend connection check failed:', error);
        if (error.status === 0) {
          return throwError(() => new Error('Cannot connect to the server. Please ensure the backend server is running on port 3001.'));
        }
        return throwError(() => new Error('Backend server health check failed: ' + (error.message || 'Unknown error')));
      })
    );
  }

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
      url: '/documentation',
      icon: 'book'
    },
    {
      title: 'Contact Support',
      url: '/support',
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
    },
    {
      question: 'How do I change my profile picture?',
      answer: 'Go to Settings > Profile, and click on your profile image or the Edit button. You can upload a new image from there.'
    }
  ];

  // Credentials ride on the session cookie, attached by the interceptor.
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  getUserProfile(): Observable<User> {
    const headers = this.getHeaders();

    // Return cached user if available
    if (this.user) {
      return of(this.user);
    }

    // Get user data from API
    return this.http.get<{success: boolean, data: User}>(`${this.apiUrl}/users/profile`, { headers })
      .pipe(
        map(response => {
          // Map backend user format to expensive-tracker-frontend User model
          const user = SettingsService.toUser(response.data);

          this.user = user;
          return user;
        }),
        catchError(error => {
          console.error('Error fetching user profile:', error);
          return throwError(() => new Error('Failed to fetch user profile. Please try again later.'));
        })
      );
  }

  updateUserProfile(userData: User): Observable<User> {
    const headers = this.getHeaders();

    return this.http.put<ApiResponse<ApiUser>>(`${this.apiUrl}/users/profile`, userData, { headers })
      .pipe(
        map(response => {
          // Map backend response to User model
          const user = SettingsService.toUser(response.data);

          this.user = user;
          return user;
        }),
        catchError(error => {
          console.error('Error updating profile:', error);
          return throwError(() => new Error('Failed to update user profile. Please try again later.'));
        })
      );
  }

  updateUserProfileWithImage(formData: FormData): Observable<User> {
    // No Content-Type here on purpose: the browser has to set the multipart
    // boundary itself, and naming the type would strip it.
    return this.http.post<ApiResponse<{ user: ApiUser; profileImage?: string }>>(
      `${this.apiUrl}/users/profile/image`,
      formData
    ).pipe(
      map(response => {
        // Extract user data and image URL from response
        const userData = response.data.user;
        const profileImage = response.data.profileImage;

        //console.log('Profile image URL from response:', profileImage);
        //console.log('User data profileImage:', userData.profileImage);

        const user = SettingsService.toUser(userData, profileImage);


        this.user = user;
        return user;
      }),
      catchError(error => {
        console.error('Error uploading profile image:', error);
        return throwError(() => new Error(
          toUserMessage(error, 'Could not upload that image. Please try again.')
        ));
      })
    );
  }

  getPaymentMethods(): Observable<PaymentMethod[]> {
    const headers = this.getHeaders();

    return this.http.get<{success: boolean, data: PaymentMethod[]}>(`${this.apiUrl}/users/payment-methods`, { headers })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching payment methods:', error);
          return throwError(() => new Error('Failed to fetch payment methods. Please try again later.'));
        })
      );
  }

  addPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id'>): Observable<PaymentMethod> {
    const headers = this.getHeaders();

    return this.http.post<{success: boolean, data: PaymentMethod}>(
      `${this.apiUrl}/users/payment-methods`,
      paymentMethod,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error adding payment method:', error);
        return throwError(() => new Error('Failed to add payment method. Please try again later.'));
      })
    );
  }

  updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): Observable<PaymentMethod> {
    const headers = this.getHeaders();

    return this.http.put<{success: boolean, data: PaymentMethod}>(
      `${this.apiUrl}/users/payment-methods/${id}`,
      updates,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error updating payment method:', error);
        return throwError(() => new Error('Failed to update payment method. Please try again later.'));
      })
    );
  }

  deletePaymentMethod(id: string): Observable<void> {
    const headers = this.getHeaders();

    return this.http.delete<ApiResponse<unknown>>(
      `${this.apiUrl}/users/payment-methods/${id}`,
      { headers }
    ).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Error deleting payment method:', error);
        return throwError(() => new Error('Failed to delete payment method. Please try again later.'));
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
    const headers = this.getHeaders();

    return this.http.put<ApiResponse<unknown>>(
      `${this.apiUrl}/users/change-password`,
      { currentPassword, newPassword },
      { headers }
    ).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Error changing password:', error);
        
        const message = error.error?.message || error.error?.error || 'Failed to change password. Please try again later.';
        return throwError(() => new Error(message));
      })
    );
  }

  changeEmail(newEmail: string, password: string): Observable<void> {
    const headers = this.getHeaders();

    return this.http.put<ApiResponse<unknown>>(
      `${this.apiUrl}/users/change-email`,
      { newEmail, password },
      { headers }
    ).pipe(
      map(() => {
        if (this.user) {
          this.user.email = newEmail;
        }
        return void 0;
      }),
      catchError(error => {
        console.error('Error changing email:', error);

        if (error.status === 401) {
          // This endpoint verifies the current password; 401 is a wrong
          // password, not an expired session.
          return throwError(() => new Error('Password is incorrect'));
        }
        return throwError(() => new Error(
          toUserMessage(error, 'Failed to change email. Please try again later.')
        ));
      })
    );
  }

  getCurrencies(): Observable<Currency[]> {
    return of(this.currencies);
  }

  updateCurrency(currencyCode: string): Observable<void> {
    const headers = this.getHeaders();

    return this.http.put<ApiResponse<unknown>>(
      `${this.apiUrl}/users/profile`,
      { currency: currencyCode },
      { headers }
    ).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Error updating currency:', error);
        return throwError(() => new Error('Failed to update currency'));
      })
    );
  }

  getSupportLinks(): Observable<SupportLink[]> {
    return of(this.supportLinks);
  }

  getFAQs(): Observable<FAQ[]> {
    return of(this.faqs);
  }
}
