import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { User } from '../../../../core/models/User';
import { SettingsService } from '../../../../services/settings.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isOpen = false;
  formData: Partial<User> = {};
  selectedImage: File | null = null;
  previewImage: SafeUrl | null = null;
  passwordForm: FormGroup;
  emailForm: FormGroup;


  constructor(
    private settingsService: SettingsService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder
  ) {
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
  }

  ngOnInit(): void {
    this.loadUserProfile();
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
          this.loadUserProfile();
        },
        error: (error) => {
          console.error('Error changing email:', error);
          alert('Failed to change email. Please try again.');
        }
      });
    }
  }
}
