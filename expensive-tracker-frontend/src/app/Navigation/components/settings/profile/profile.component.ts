import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faCheckCircle, faExclamationCircle, faUser, faEdit, faPlus, faShieldAlt, faCamera, faSave, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { SideDrawerComponent } from '../../../../shared/components/side-drawer/side-drawer.component';
import { User } from '../../../../core/models/User';
import { SettingsService } from '../../../../services/settings.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FontAwesomeModule,
    SideDrawerComponent
],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  user: User | null = null;
  isOpen = false;
  formData: Partial<User> = {};
  selectedImage: File | null = null;
  previewImage: SafeUrl | null = null;
  passwordForm: FormGroup;
  emailForm: FormGroup;
  isLoading = false;
  isSaving = false;
  isPasswordChanging = false;
  isEmailChanging = false;
  uploadProgress = 0;
  imageError = false;

  // Password visibility
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;
  hideEmailPassword = true;

  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faCheckCircle = faCheckCircle;
  faExclamationCircle = faExclamationCircle;
  faUser = faUser;
  faEdit = faEdit;
  faPlus = faPlus;
  faShieldAlt = faShieldAlt;
  faCamera = faCamera;
  faSave = faSave;
  faRefresh = faRefresh;

  readonly MASKED_PASSWORD = '●●●●●●●●●●';

  constructor() {
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
    this.isLoading = true;
    this.settingsService.getUserProfile().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (user) => {
        // Process user data before assigning
        if (user) {
          // First check if we need to add a unique identifier to bust cache
          if (user.profileImage && !user.profileImage.includes('?')) {
            user.profileImage = `${user.profileImage}?t=${Date.now()}`;
          }

          if (user.avatar && !user.avatar.includes('?')) {
            user.avatar = `${user.avatar}?t=${Date.now()}`;
          }

          this.user = user;

          // Set masked password in forms
          this.passwordForm.patchValue({ currentPassword: this.MASKED_PASSWORD });
          this.emailForm.patchValue({ password: this.MASKED_PASSWORD });

          // Pre-load images to test CORS and prepare for display
          this.preloadUserImages(user);
        }
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  /**
   * Preload user images to test if they're accessible and prepare them for display
   */
  private preloadUserImages(user: User): void {
    if (user.profileImage || user.avatar) {
      // Try to load the profile image first
      if (user.profileImage) {

        const img = new Image();
        img.crossOrigin = 'anonymous'; // Try with CORS
        img.onload = () => {
          // Image loaded successfully with crossOrigin, nothing else to do
        };
        img.onerror = () => {
          console.error('Failed to load profile image from URL:', user.profileImage);

          // If profile image fails and we have an avatar, try to use that instead
          if (user.avatar && user.profileImage !== user.avatar) {
            user.profileImage = user.avatar;
          }
        };
        img.src = user.profileImage;
      } else if (user.avatar) {
        // No profile image but we have an avatar, set it as profile image
        user.profileImage = user.avatar;
      }
    }
  }

  initializeFormData(): void {
    if (this.user) {
      this.formData = {
        firstName: this.user.firstName || '',
        lastName: this.user.lastName || '',
        email: this.user.email || '',
        phone: this.user.phone || '',
        bio: this.user.bio || '',
        location: this.user.location || '',
        role: this.user.role || '',
      };

      // Reset the image preview and selection
      this.selectedImage = null;
      this.previewImage = null;
    }
  }

  openModal(): void {
    this.initializeFormData();
    this.isOpen = true;
  }

  onClose(): void {
    this.isOpen = false;
  }

  // Generate a default avatar as data URL when image is not available
  getDefaultAvatarUrl(): string {
    // Return a basic data URI for a default avatar (light gray circle with user silhouette)
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2U1ZTdlYiIvPjxjaXJjbGUgY3g9IjEyOCIgY3k9Ijk2IiByPSI2NCIgZmlsbD0iI2E1YTVhNSIvPjxwYXRoIGQ9Ik0yMTYgMjQwSDQwYzAtNDQuMiAzNS44LTgwIDgwLTgwSDEzNmM0NC4yIDAgODAgMzUuOCA4MCA4MHoiIGZpbGw9IiNhNWE1YTUiLz48L3N2Zz4=';
  }

  /**
   * Falls back to the inline default avatar when the profile image won't load.
   *
   * This used to special-case `localhost:3001` and retry the same URL with a
   * cache-busting query string. A retry that also failed re-entered this handler
   * with the host still matching, so it retried again — an unbounded loop
   * hammering the server for an image that was never going to load. The CORS
   * headers it was working around are set on /uploads by the API itself now.
   */
  handleImageError(event: Event): void {
    this.imageError = true;
    const imgElement = event.target as HTMLImageElement;
    const fallback = this.getDefaultAvatarUrl();

    // The fallback is an inline data URI, so it cannot fail — but guard anyway
    // rather than rely on that to terminate the handler.
    if (imgElement.src !== fallback) {
      imgElement.src = fallback;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.isValidImageFile(file)) {
        this.selectedImage = file;
        this.createImagePreview(file);
      } else {
        this.notifications.error('Please choose a PNG or JPG image.');
        // Reset input so user can try again
        input.value = '';
      }
    }
  }

  private isValidImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return false;
    }

    if (file.size > maxSizeInBytes) {
      this.notifications.error(`That image is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The maximum is 5 MB.`);
      return false;
    }

    return true;
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const dataUrl = typeof e.target?.result === 'string' ? e.target.result : '';
      this.previewImage = this.sanitizer.bypassSecurityTrustUrl(dataUrl);
    };
    reader.onerror = (e) => {
      console.error('Error creating image preview:', e);
      this.notifications.error('Could not preview that image. Please try another.');
    };
    reader.readAsDataURL(file);
  }

  onSave(): void {
    this.isSaving = true;

    // Check if backend is reachable before attempting to save
    this.checkBackendConnection();
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  clearMaskedPassword(controlName: string, form: FormGroup): void {
    if (form.get(controlName)?.value === this.MASKED_PASSWORD) {
      form.get(controlName)?.setValue('');
    }
  }

  onPasswordChange(): void {
    if (this.passwordForm.valid) {
      const { currentPassword, newPassword } = this.passwordForm.value;

      if (currentPassword === this.MASKED_PASSWORD) {
        this.showNotification('Please enter your actual current password.', 'error');
        return;
      }

      this.isPasswordChanging = true;
      this.settingsService.changePassword(currentPassword, newPassword).pipe(
        finalize(() => this.isPasswordChanging = false)
      ).subscribe({
        next: () => {
          this.showNotification('Password changed successfully!', 'success');
          this.passwordForm.reset();
        },
        error: (error) => {
          console.error('Error changing password:', error);
          this.showNotification(error.message, 'error');
        }
      });
    }
  }

  onEmailChange(): void {
    if (this.emailForm.valid) {
      const { newEmail, password } = this.emailForm.value;

      if (password === this.MASKED_PASSWORD) {
        this.showNotification('Please enter your password to confirm email change.', 'error');
        return;
      }

      this.isEmailChanging = true;
      this.settingsService.changeEmail(newEmail, password).pipe(
        finalize(() => this.isEmailChanging = false)
      ).subscribe({
        next: () => {
          this.showNotification('Email changed successfully!', 'success');
          this.emailForm.reset();
          this.loadUserProfile();
        },
        error: (error) => {
          console.error('Error changing email:', error);
          this.showNotification(error.message, 'error');
        }
      });
    }
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    if (type === 'error') {
      this.notifications.error(message);
    } else {
      this.notifications.success(message);
    }
  }

  // Add a method to check if the backend server is reachable
  private checkBackendConnection(): void {
    // Check if the backend server is reachable first
    this.settingsService.checkServerConnection().subscribe({
      next: () => {
        // If we have a selected image, proceed with the save operation
        if (this.selectedImage) {
          this.saveWithImage();
        } else if (this.user && this.formData) {
          this.saveWithoutImage();
        } else {
          this.isSaving = false;
          this.showNotification('No changes to save.', 'error');
        }
      },
      error: (error) => {
        console.error('Backend connection check failed:', error);
        this.isSaving = false;
        this.showNotification('Could not reach the server. Check your connection and try again.', 'error');
      }
    });
  }

  /**
   * Helper method to create a URL that can be used to download an image directly
   * This can help bypass CORS issues with localhost images
   */
  createDirectImageUrl(url: string | undefined | null): string | null {
    if (!url) return null;

    // For localhost URLs, we can try a few approaches
    if (url.includes('localhost')) {
      // 1. Add a timestamp to bypass cache
      const timestampParam = url.includes('?') ? '&t=' : '?t=';
      return `${url}${timestampParam}${Date.now()}`;
    }

    return url;
  }

  // Save profile with image
  private saveWithImage(): void {
    // Create a FormData object for the image and profile data
    const formData = new FormData();

    try {
      // First append the image file with the correct field name
      formData.append('profileImage', this.selectedImage!);

      // Add other form data fields to the formData
      // Object.entries carries the value along, so the field does not need to be
      // read back through an index signature Partial<User> does not have.
      Object.entries(this.formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Convert any object values to strings for FormData
          formData.append(key, String(value));
        }
      });

      // If firstName and lastName are provided but name is not, construct the name
      if (this.formData.firstName && this.formData.lastName) {
        const fullName = `${this.formData.firstName} ${this.formData.lastName}`;
        formData.append('name', fullName);
      }

      this.settingsService.updateUserProfileWithImage(formData).pipe(
        finalize(() => {
          this.isSaving = false;
        })
      ).subscribe({
        next: (user) => {
          this.user = user;
          this.isOpen = false;
          this.selectedImage = null;
          this.previewImage = null;
          // Show success notification
          this.showNotification('Profile updated successfully!', 'success');

          // Set the user data including the profile image and refresh
          if (user.profileImage) {
            // Force browser to reload the image by appending a timestamp
            user.profileImage = `${user.profileImage}?t=${new Date().getTime()}`;
          }

          // Update the user object and refresh
          this.user = user;
          setTimeout(() => this.loadUserProfile(), 500);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          const errorMessage = error.message || 'Failed to update profile';
          this.showNotification(`Error: ${errorMessage}`, 'error');
        }
      });
    } catch (e) {
      console.error('Error preparing form data:', e);
      this.showNotification('Error preparing your data for upload. Please try again.', 'error');
      this.isSaving = false;
    }
  }

  // Save profile without image
  private saveWithoutImage(): void {
    // Construct the updated user object
    const updatedUser: User = {
      ...this.user!,
      ...this.formData
    };


    // If firstName and lastName are provided but name is not, construct the name
    if (this.formData.firstName && this.formData.lastName) {
      updatedUser.name = `${this.formData.firstName} ${this.formData.lastName}`;
    }

    this.settingsService.updateUserProfile(updatedUser).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: (user) => {
        this.user = user;
        this.isOpen = false;
        this.showNotification('Profile updated successfully!', 'success');
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        const errorMessage = error.message || 'Failed to update profile';
        this.showNotification(`Error: ${errorMessage}`, 'error');
      }
    });
  }
}
