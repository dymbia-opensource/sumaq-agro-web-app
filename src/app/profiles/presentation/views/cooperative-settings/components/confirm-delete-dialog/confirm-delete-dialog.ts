import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDeleteDialogData {
  advisorName: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirm-delete-dialog.html',
  styleUrl: './confirm-delete-dialog.css',
})
export class ConfirmDeleteDialog {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialog>);
  readonly data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
