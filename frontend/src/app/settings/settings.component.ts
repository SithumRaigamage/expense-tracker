import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../models/User'
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  user: User | null = null;
  isOpen = false;
  formData: Partial<User> = {};

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.settingsService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.initializeFormData();
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

  onSave(): void {
    if (this.user && this.formData) {
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
}
