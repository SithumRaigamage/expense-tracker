import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

type NotificationPriority = 'critical' | 'normal' | 'medium';

interface NotificationUser {
  name: string;
  avatar: string;
  isOnline?: boolean;
}

interface Notification {
  id: string;
  user: NotificationUser;
  message: string;
  type: string;
  priority: NotificationPriority;
  timestamp: Date;
  isRead: boolean;
}

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-dropdown.component.html',
})
export class NotificationDropdownComponent {
  isOpen = false;
  notifying = true;

  notifications: Notification[] = [
    {
      id: '1',
      user: {
        name: 'System Alert',
        avatar: 'assets/images/system-alert.png',
        isOnline: true
      },
      message: 'Emergency fund target is below threshold',
      type: 'alert',
      priority: 'critical',
      timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      isRead: false
    },
    {
      id: '2',
      user: {
        name: 'Budget Warning',
        avatar: 'assets/images/budget-alert.png',
        isOnline: true
      },
      message: 'Monthly budget limit reached for Entertainment category',
      type: 'budget',
      priority: 'medium',
      timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      isRead: false
    },
    {
      id: '3',
      user: {
        name: 'Wallet Update',
        avatar: 'assets/images/wallet-update.png',
        isOnline: true
      },
      message: 'Successfully synced transactions from all accounts',
      type: 'sync',
      priority: 'normal',
      timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      isRead: true
    }
  ];

  getPriorityStyles(priority: NotificationPriority): string {
    const styles = {
      critical: 'bg-red-500',
      medium: 'bg-orange-400',
      normal: 'bg-green-500'
    };
    return styles[priority];
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  handleClick(): void {
    this.toggleDropdown();
    this.notifying = false;
  }

  markAsRead(notification: Notification): void {
    notification.isRead = true;
  }
}
