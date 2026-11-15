import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/** Data shown in the dialog. */
export interface CloseCampaignDialogData {
  season: string;
}

/** Confirms the closing of a campaign. */
@Component({
  selector: 'app-close-campaign-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './close-campaign-dialog.html',
  styleUrl: './close-campaign-dialog.css',
})
export class CloseCampaignDialog {
  protected readonly data = inject<CloseCampaignDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<CloseCampaignDialog, boolean>>(MatDialogRef);

  protected onConfirm(): void {
    this.dialogRef.close(true);
  }
}
