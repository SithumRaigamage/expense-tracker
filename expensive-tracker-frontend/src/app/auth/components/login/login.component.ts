import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faSpinner, faArrowRight, faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
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

  /** Where to send the user after login — set when a guard/interceptor bounced them here. */
  private returnUrl = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.returnUrl = params['returnUrl'] || '/dashboard';

    // Explain the bounce, rather than dropping the user on a blank login form.
    if (params['sessionExpired']) {
      this.error = 'Your session has expired. Please sign in again.';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (error) => {
          this.loading = false;
          this.error = error.message || 'Login failed. Please check your credentials.';
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
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

  get emailErrors() {
    const control = this.loginForm.get('email');
    return {
      required: control?.hasError('required') && control?.touched,
      email: control?.hasError('email') && control?.touched
    };
  }

  get passwordErrors() {
    const control = this.loginForm.get('password');
    return {
      required: control?.hasError('required') && control?.touched,
      minlength: control?.hasError('minlength') && control?.touched
    };
  }
}

