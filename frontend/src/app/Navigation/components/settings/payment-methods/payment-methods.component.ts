import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { SettingsService } from '../../../../services/settings.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
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
  selector: 'app-payment-methods',
  standalone: true, // Add this if it's a standalone component
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterModule
  ],
  templateUrl: './payment-methods.component.html',
  styleUrl: './payment-methods.component.css'
})
export class PaymentMethodsComponent {

  isPaymentModalOpen = false;
  isEditMode = false;
  selectedPaymentId: string | null = null;
  paymentForm!: FormGroup;
  paymentMethods: PaymentMethod[] = [];

  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);
    // Initialize the form with default values
    this.paymentForm = this.fb.group({
      type: ['visa', Validators.required],
      cardNumber: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{16}$'),
        Validators.minLength(16),
        Validators.maxLength(16)
      ]],
      expiryMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      expiryYear: ['', [Validators.required, Validators.min(23), Validators.max(99)]],
      isDefault: [false]
    });
  }

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.settingsService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
        console.log('Payment methods loaded:', this.paymentMethods);
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
      }
    });
  }

  addPaymentMethod(): void {
    this.isEditMode = false;
    this.selectedPaymentId = null;
    this.paymentForm.reset({ type: 'visa', isDefault: false });
    this.isPaymentModalOpen = true;
  }

  getCardImage(type: 'visa' | 'mastercard'): string {
    return this.settingsService.getCardImage(type);
  }

  getCardIcon(type: 'visa' | 'mastercard'): IconDefinition {
    return this.settingsService.getCardIcon(type);
  }

  getLastFourDigits(cardNumber: string): string {
    return cardNumber.slice(-4);
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
    console.log('Setting default payment method:', id);
  }

}
