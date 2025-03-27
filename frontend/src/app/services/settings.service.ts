import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private dummyUser: User = {
    name: 'Sithum Raigamage',
    firstName: 'Sithum',
    lastName: 'Raigamage',
    role: 'Software Engineer',
    location: 'Colombo, Sri Lanka',
    profileImage: 'assets/images/user/owner.png',
    email: 'sraig2002@gmail.com',
    phone: '+94 77 123 4567',
    bio: 'Enthusiastic software engineering intern with a passion for web development and new technologies. Currently learning Angular and TypeScript while contributing to full-stack projects.'
  };

  getUserProfile(): Observable<User> {
    return of(this.dummyUser);
  }

  updateUserProfile(userData: User): Observable<User> {
    // Simulate API call
    this.dummyUser = { ...userData };
    return of(this.dummyUser);
  }
}
