import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, filter } from 'rxjs/operators';
import { User } from '../core/models/User';
import { faCcVisa, faCcMastercard } from '@fortawesome/free-brands-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { environment } from '../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = environment.apiUrl;
  private user: User | null = null;

  // Method to check if the server is reachable
  checkServerConnection(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`).pipe(
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

  constructor(private http: HttpClient) {}

  // Helper method to get auth headers
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
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
          // Map backend user format to frontend User model
          const userData = response.data;
          const user: User = {
            ...userData,
            // Ensure required fields have default values
            name: userData.name || '',
            email: userData.email || '',
            // Use profileImage if available, fall back to avatar
            profileImage: userData.profileImage || userData.avatar || '',
            // If firstName/lastName not provided, try to extract from name
            firstName: userData.firstName || userData.name?.split(' ')[0] || '',
            lastName: userData.lastName || (userData.name?.split(' ').length > 1 ?
              userData.name.split(' ').slice(1).join(' ') : '')
          };

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

    return this.http.put<{success: boolean, data: any}>(`${this.apiUrl}/users/profile`, userData, { headers })
      .pipe(
        map(response => {
          // Map backend response to User model
          const userData = response.data;
          const user: User = {
            ...userData,
            // Ensure required fields have default values
            name: userData.name || '',
            email: userData.email || '',
            // Use profileImage if available, fall back to avatar
            profileImage: userData.profileImage || userData.avatar || '',
            // If firstName/lastName not provided, try to extract from name
            firstName: userData.firstName || userData.name?.split(' ')[0] || '',
            lastName: userData.lastName || (userData.name?.split(' ').length > 1 ?
              userData.name.split(' ').slice(1).join(' ') : '')
          };

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
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Sending profile image to API...');

    // Log formData contents for debugging
    formData.forEach((value, key) => {
      if (key !== 'profileImage') { // Don't log binary data
        console.log(`FormData contains: ${key}: ${value}`);
      } else {
        console.log(`FormData contains file: ${key}`);
      }
    });

    // Upload the image to API
    return this.http.post<{success: boolean, data: any}>(
      `${this.apiUrl}/users/profile/image`,
      formData,
      { headers }
    ).pipe(
      tap(response => {
        console.log('Raw API response:', JSON.stringify(response, null, 2));
      }),
      map(response => {
        console.log('Profile update response received:', response);
        // Extract user data and image URL from response
        const userData = response.data.user;
        const profileImage = response.data.profileImage;

        //console.log('Profile image URL from response:', profileImage);
        //console.log('User data profileImage:', userData.profileImage);
        console.log('User data avatar:', userData.avatar);

        const user: User = {
          ...userData,
          // Ensure required fields
          name: userData.name || '',
          email: userData.email || '',
          // Use the new profile image URL and ensure it's properly set
          profileImage: profileImage || userData.profileImage || userData.avatar || '',
          // If firstName/lastName not provided, extract from name
          firstName: userData.firstName || userData.name?.split(' ')[0] || '',
          lastName: userData.lastName || (userData.name?.split(' ').length > 1 ?
            userData.name.split(' ').slice(1).join(' ') : '')
        };

        console.log('Final user object with profileImage:', user.profileImage);

        this.user = user;
        return user;
      }),
      catchError(error => {
        console.error('Error uploading profile image:', error);

        // Check for connection errors (status 0)
        if (error.status === 0) {
          console.error('Connection error - backend server might not be running');
          return throwError(() => new Error('Cannot connect to the server. Please make sure the backend is running and try again.'));
        }

        console.error('Error details:', error.error);
        console.error('Status:', error.status);

        if (error.status === 413) {
          return throwError(() => new Error('Image file is too large. Please choose a smaller image.'));
        } else if (error.status === 415) {
          return throwError(() => new Error('Invalid file type. Please select a valid image file (JPG, PNG).'));
        } else if (error.status === 403 || error.status === 401) {
          return throwError(() => new Error('Unauthorized: Please log in again.'));
        } else if (error.status === 500) {
          console.error('Server error details:', error.error);
          return throwError(() => new Error('Server error during file upload. Please try again later.'));
        }

        // Provide more specific error message if available
        const errorMessage = error.error?.error || error.message || 'Unknown error';
        return throwError(() => new Error(`Failed to upload profile image: ${errorMessage}`));
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

    return this.http.delete<{success: boolean, data: any}>(
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

    return this.http.put<{success: boolean, data: any}>(
      `${this.apiUrl}/users/change-password`,
      { currentPassword, newPassword },
      { headers }
    ).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Error changing password:', error);

        if (error.status === 401) {
          return throwError(() => new Error('Current password is incorrect'));
        }

        return throwError(() => new Error('Failed to change password. Please try again later.'));
      })
    );
  }

  changeEmail(newEmail: string, password: string): Observable<void> {
    const headers = this.getHeaders();

    return this.http.put<{success: boolean, data: any}>(
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
          return throwError(() => new Error('Password is incorrect'));
        }
        return throwError(() => new Error('Failed to change email. Please try again later.'));
      })
    );
  }

  getCurrencies(): Observable<Currency[]> {
    return of(this.currencies);
  }

  updateCurrency(currencyCode: string): Observable<void> {
    const headers = this.getHeaders();

    return this.http.put<{success: boolean, data: any}>(
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
