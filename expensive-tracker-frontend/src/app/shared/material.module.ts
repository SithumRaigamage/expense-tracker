import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';

/**
 * Module to centralize and provide all Angular Material components
 */
@NgModule({
  exports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  providers: [
    provideAnimations()
  ]
})
export class MaterialModule { }

// To be used with standalone components
export const materialImports = [
  MatDialogModule,
  MatButtonModule,
  MatIconModule,
  MatSnackBarModule
];

// To be used in app.config.ts
export const materialProviders = [
  provideAnimations()
];
