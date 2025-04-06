import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { User } from '../models/User';
import { SettingsService } from '../services/settings.service';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Currency } from '../services/settings.service';
import { SupportLink, FAQ } from '../services/settings.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { map } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard';
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  user: User | null = null;
  isOpen = false;
  formData: Partial<User> = {};
  paymentMethods: PaymentMethod[] = [];
  isPaymentModalOpen = false;
  isEditMode = false;
  selectedPaymentId: string | null = null;
  paymentForm: FormGroup;
  selectedImage: File | null = null;
  previewImage: SafeUrl | null = null;
  passwordForm: FormGroup;
  emailForm: FormGroup;
  currencies: Currency[] = [];
  selectedCurrency: string = 'LKR'; // Default currency
  supportLinks: SupportLink[] = [];
  faqs: (FAQ & { isOpen: boolean })[] = []; // Explicitly include isOpen

  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    library: FaIconLibrary
  ) {
    this.paymentForm = this.fb.group({
      type: ['visa', Validators.required],
      cardNumber: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{16}$'), // Validate 16-digit card numbers
        Validators.minLength(16),
        Validators.maxLength(16)
      ]],
      expiryMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      expiryYear: ['', [Validators.required, Validators.min(23), Validators.max(99)]],
      isDefault: [false]
    });

    // Initialize password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Initialize email form
    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadPaymentMethods();
    this.loadCurrencies();
    this.loadSupportContent();
  }

  loadUserProfile(): void {
    this.settingsService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  loadPaymentMethods(): void {
    this.settingsService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
      }
    });
  }

  loadCurrencies(): void {
    this.settingsService.getCurrencies().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
      },
      error: (error) => {
        console.error('Error loading currencies:', error);
      }
    });
  }

  loadSupportContent(): void {
    this.settingsService.getSupportLinks().subscribe({
      next: (links) => {
        this.supportLinks = links;
      }
    });

    this.settingsService.getFAQs().pipe(
      map(faqs => faqs.map(faq => ({
        ...faq,
        isOpen: false // Initialize each FAQ as closed
      })))
    ).subscribe({
      next: (faqs) => {
        this.faqs = faqs;
      }
    });
  }

  getCardImage(type: 'visa' | 'mastercard'): string {
    return this.settingsService.getCardImage(type);
  }

  getCardIcon(type: 'visa' | 'mastercard'): IconDefinition {
    return this.settingsService.getCardIcon(type);
  }

  initializeFormData(): void {
    if (this.user) {
      this.formData = {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        phone: this.user.phone,
        bio: this.user.bio,
      };
    }
  }

  openModal(): void {
    this.initializeFormData();
    this.isOpen = true;
  }

  onClose(): void {
    this.isOpen = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.isValidImageFile(file)) {
        this.selectedImage = file;
        this.createImagePreview(file);
      } else {
        alert('Please select a valid image file (PNG, JPG, or JPEG)');
      }
    }
  }

  private isValidImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(file.type);
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImage = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  onSave(): void {
    if (this.selectedImage) {
      const formData = new FormData();
      formData.append('profileImage', this.selectedImage);
      Object.keys(this.formData).forEach(key => {
        formData.append(key, (this.formData as any)[key]);
      });

      this.settingsService.updateUserProfileWithImage(formData).subscribe({
        next: (user) => {
          this.user = user;
          this.isOpen = false;
          this.selectedImage = null;
          this.previewImage = null;
        },
        error: (error) => {
          console.error('Error updating profile:', error);
        }
      });
    } else if (this.user && this.formData) {
      const updatedUser: User = {
        ...this.user,
        ...this.formData,
        name: `${this.formData.firstName} ${this.formData.lastName}`
      };

      this.settingsService.updateUserProfile(updatedUser).subscribe({
        next: (user) => {
          this.user = user;
          this.isOpen = false;
        },
        error: (error) => {
          console.error('Error updating user profile:', error);
        }
      });
    }
  }

  addPaymentMethod(): void {
    this.isEditMode = false;
    this.selectedPaymentId = null;
    this.paymentForm.reset({ type: 'visa', isDefault: false });
    this.isPaymentModalOpen = true;
  }

  editPaymentMethod(id: string): void {
    const method = this.paymentMethods.find(m => m.id === id);
    if (method) {
      this.isEditMode = true;
      this.selectedPaymentId = id;
      this.paymentForm.patchValue({
        type: method.type,
        cardNumber: method.cardNumber, // Use full card number
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        isDefault: method.isDefault
      });
      this.isPaymentModalOpen = true;
    }
  }

  deletePaymentMethod(id: string): void {
    if (confirm('Are you sure you want to delete this payment method?')) {
      this.settingsService.deletePaymentMethod(id).subscribe({
        next: () => {
          this.loadPaymentMethods();
        },
        error: (error) => {
          console.error('Error deleting payment method:', error);
        }
      });
    }
  }

  onPaymentSubmit(): void {
    if (this.paymentForm.valid) {
      const formData = this.paymentForm.value;

      if (this.isEditMode && this.selectedPaymentId) {
        this.settingsService.updatePaymentMethod(this.selectedPaymentId, formData).subscribe({
          next: () => {
            this.loadPaymentMethods();
            this.closePaymentModal();
          },
          error: (error) => {
            console.error('Error updating payment method:', error);
          }
        });
      } else {
        this.settingsService.addPaymentMethod(formData).subscribe({
          next: () => {
            this.loadPaymentMethods();
            this.closePaymentModal();
          },
          error: (error) => {
            console.error('Error adding payment method:', error);
          }
        });
      }
    }
  }

  closePaymentModal(): void {
    this.isPaymentModalOpen = false;
    this.paymentForm.reset({ type: 'visa', isDefault: false });
  }

  setDefaultPaymentMethod(id: string): void {
    // TODO: Implement setting default payment method
    //console.log('Setting default payment method:', id);
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onPasswordChange(): void {
    if (this.passwordForm.valid) {
      const { currentPassword, newPassword } = this.passwordForm.value;
      this.settingsService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          alert('Password changed successfully');
          this.passwordForm.reset();
        },
        error: (error) => {
          console.error('Error changing password:', error);
          alert('Failed to change password. Please try again.');
        }
      });
    }
  }

  onEmailChange(): void {
    if (this.emailForm.valid) {
      const { newEmail, password } = this.emailForm.value;
      this.settingsService.changeEmail(newEmail, password).subscribe({
        next: () => {
          alert('Email changed successfully');
          this.emailForm.reset();
          this.loadUserProfile(); // Reload user profile to show new email
        },
        error: (error) => {
          console.error('Error changing email:', error);
          alert('Failed to change email. Please try again.');
        }
      });
    }
  }

  onCurrencyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.settingsService.updateCurrency(select.value).subscribe({
      next: () => {
        this.selectedCurrency = select.value;
        alert('Currency updated successfully');
      },
      error: (error) => {
        console.error('Error updating currency:', error);
        alert('Failed to update currency');
      }
    });
  }

  toggleFAQ(faq: FAQ & { isOpen: boolean }): void {
    faq.isOpen = !faq.isOpen;
  }

  getLastFourDigits(cardNumber: string): string {
    return cardNumber.slice(-4);
  }
}
