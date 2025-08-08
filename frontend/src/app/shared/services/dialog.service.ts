import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  iconColor?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Opens a confirmation dialog
   * @param data Dialog configuration data
   * @returns An observable that completes when the dialog closes and emits true if confirmed or false if canceled
   */
  openConfirmDialog(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      panelClass: 'confirmation-dialog',
      data: {
        title: data.title,
        message: data.message,
        confirmText: data.confirmText || 'Confirm',
        cancelText: data.cancelText || 'Cancel',
        icon: data.icon || 'warning',
        iconColor: data.iconColor || 'warn'
      }
    });

    return dialogRef.afterClosed();
  }

  /**
   * Convenience method for delete confirmations
   * @param itemName The name of the item being deleted
   * @returns An observable that completes when the dialog closes and emits true if confirmed or false if canceled
   */
  confirmDelete(itemName: string): Observable<boolean> {
    return this.openConfirmDialog({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete this ${itemName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'delete',
      iconColor: 'warn'
    });
  }
}
