import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faCheckCircle, faExclamationCircle, faUser, faEdit, faPlus, faShieldAlt, faCamera, faSave, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { SideDrawerComponent } from '../../../../shared/components/side-drawer/side-drawer.component';
import { User } from '../../../../core/models/User';
import { SettingsService } from '../../../../services/settings.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';

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
  user: User | null = null;
  isOpen = false;
  formData: Partial<User> = {};
  selectedImage: File | null = null;
  previewImage: SafeUrl | null = null;
  passwordForm: FormGroup;
  emailForm: FormGroup;
  isLoading: boolean = false;
  isSaving: boolean = false;
  isPasswordChanging: boolean = false;
  isEmailChanging: boolean = false;
  uploadProgress: number = 0;
  imageError: boolean = false;

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
          console.log('User profile loaded:', user);

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
        console.log('Testing profile image URL:', user.profileImage);

        const img = new Image();
        img.crossOrigin = 'anonymous'; // Try with CORS
        img.onload = () => {
          console.log('Profile image loaded successfully');
          // Image loaded successfully with crossOrigin, nothing else to do
        };
        img.onerror = () => {
          console.error('Failed to load profile image from URL:', user.profileImage);

          // If profile image fails and we have an avatar, try to use that instead
          if (user.avatar && user.profileImage !== user.avatar) {
            console.log('Profile image failed to load, falling back to avatar');
            user.profileImage = user.avatar;
          }
        };
        img.src = user.profileImage;
      } else if (user.avatar) {
        // No profile image but we have an avatar, set it as profile image
        console.log('No profile image found, using avatar instead:', user.avatar);
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

  // Handle image loading errors
  handleImageError(event: Event): void {
    console.log('Image failed to load, replacing with default avatar');
    this.imageError = true;
    const imgElement = event.target as HTMLImageElement;
    console.error('Image failed to load from URL:', imgElement.src);

    // If the failure is due to CORS with a localhost URL, try to work around it by using a proxy
    if (imgElement.src.includes('localhost:3001')) {
      // Try with a proxy or alternative approach
      const originalUrl = imgElement.src;

      // Create a new img element to test if this is a CORS issue
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous'; // Try with CORS

      testImg.onload = () => {
        // If it loads with crossOrigin, use that
        console.log('Image loaded successfully with crossOrigin');
        imgElement.crossOrigin = 'anonymous';
        imgElement.src = originalUrl + (originalUrl.includes('?') ? '&' : '?') + 'cors=' + new Date().getTime();
      };

      testImg.onerror = () => {
        // If the CORS approach fails, use a data URL if possible
        // This is a fallback but has limitations
        if (this.user?.avatar === imgElement.src && this.user?.profileImage) {
          console.log('Trying profileImage as alternative');
          imgElement.src = this.user.profileImage;
        } else {
          // As a last resort, use the default avatar
          imgElement.src = this.getDefaultAvatarUrl();
        }
      };

      // Test with crossOrigin
      testImg.crossOrigin = 'anonymous';
      testImg.src = originalUrl;
    } else {
      // For non-localhost URLs or other errors, use the default avatar
      imgElement.src = this.getDefaultAvatarUrl();
    }
  }

  // Handle successful image loading
  onImageLoaded(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.log('Image successfully loaded from URL:', imgElement.src);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.isValidImageFile(file)) {
        console.log(`Selected image: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
        this.selectedImage = file;
        this.createImagePreview(file);
      } else {
        alert('Please select a valid image file (PNG, JPG, or JPEG)');
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
      alert(`File is too large. Maximum size is 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return false;
    }

    return true;
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImage = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
      console.log('Preview image created');
    };
    reader.onerror = (e) => {
      console.error('Error creating image preview:', e);
      alert('Error creating image preview. Please try another image.');
    };
    reader.readAsDataURL(file);
  }

  onSave(): void {
    this.isSaving = true;
    console.log('Save button clicked');

    // Verify we have a valid token
    const token = localStorage.getItem('token');
    if (!token) {
      this.showNotification('You must be logged in. Please log in and try again.', 'error');
      this.isSaving = false;
      return;
    }

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

  // Simple notification method - in a real app, you'd use a notification service
  private showNotification(message: string, type: 'success' | 'error'): void {
    alert(message);
  }

  // Add a method to check if the backend server is reachable
  private checkBackendConnection(): void {
    // Check if the backend server is reachable first
    this.settingsService.checkServerConnection().subscribe({
      next: () => {
        console.log('Backend server is reachable, proceeding with save');
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
        this.showNotification('Cannot connect to the server. Please make sure the backend server is running at http://localhost:3001 and try again.', 'error');
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
      console.log('Selected image appended to form data:', this.selectedImage!.name);

      // Add other form data fields to the formData
      Object.keys(this.formData).forEach(key => {
        if ((this.formData as any)[key] !== undefined && (this.formData as any)[key] !== null) {
          // Convert any object values to strings for FormData
          formData.append(key, String((this.formData as any)[key]));
          console.log(`Added form data: ${key} = ${(this.formData as any)[key]}`);
        }
      });

      // If firstName and lastName are provided but name is not, construct the name
      if (this.formData.firstName && this.formData.lastName) {
        const fullName = `${this.formData.firstName} ${this.formData.lastName}`;
        formData.append('name', fullName);
        console.log(`Added name to form data: ${fullName}`);
      }

      console.log('Uploading profile with image...');

      // Debug formData contents
      formData.forEach((value, key) => {
        if (key !== 'profileImage') {
          console.log(`FormData contains: ${key} = ${value}`);
        } else {
          console.log(`FormData contains file: ${key}`);
        }
      });

      this.settingsService.updateUserProfileWithImage(formData).pipe(
        finalize(() => {
          this.isSaving = false;
          console.log('Upload completed');
        })
      ).subscribe({
        next: (user) => {
          console.log('Profile updated successfully', user);
          this.user = user;
          this.isOpen = false;
          this.selectedImage = null;
          this.previewImage = null;
          // Show success notification
          this.showNotification('Profile updated successfully!', 'success');

          // Set the user data including the profile image and refresh
          if (user.profileImage) {
            console.log('Setting profile image URL:', user.profileImage);
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

    console.log('Updating profile without image:', updatedUser);

    // If firstName and lastName are provided but name is not, construct the name
    if (this.formData.firstName && this.formData.lastName) {
      updatedUser.name = `${this.formData.firstName} ${this.formData.lastName}`;
      console.log(`Setting name: ${updatedUser.name}`);
    }

    this.settingsService.updateUserProfile(updatedUser).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: (user) => {
        console.log('Profile updated successfully:', user);
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
