import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog', standalone: true, imports: [MatDialogModule, MatButtonModule],
  template: `
  <h2 mat-dialog-title>{{ d.title }}</h2>
  <mat-dialog-content>{{ d.message }}</mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button [mat-dialog-close]="false">Cancel</button>
    <button mat-flat-button color="primary" [mat-dialog-close]="true">{{ d.confirmText ?? 'Confirm' }}</button>
  </mat-dialog-actions>`,
})
export class ConfirmDialogComponent {
  d = inject<{ title: string; message: string; confirmText?: string }>(MAT_DIALOG_DATA);
}
