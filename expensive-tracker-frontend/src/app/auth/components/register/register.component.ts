import { Component, OnInit } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faSpinner, faArrowRight, faLock, faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  error = '';
  showPassword = false;

  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faSpinner = faSpinner;
  faArrowRight = faArrowRight;
  faLock = faLock;
  faEnvelope = faEnvelope;
  faUser = faUser;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.error = error.message || 'Registration failed. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as any).controls) {
        this.markFormGroupTouched(control as any);
      }
    });
  }

  get nameErrors() {
    const control = this.registerForm.get('name');
    return {
      required: control?.hasError('required') && control?.touched,
      minlength: control?.hasError('minlength') && control?.touched
    };
  }

  get emailErrors() {
    const control = this.registerForm.get('email');
    return {
      required: control?.hasError('required') && control?.touched,
      email: control?.hasError('email') && control?.touched
    };
  }

  get passwordErrors() {
    const control = this.registerForm.get('password');
    return {
      required: control?.hasError('required') && control?.touched,
      minlength: control?.hasError('minlength') && control?.touched
    };
  }
}

