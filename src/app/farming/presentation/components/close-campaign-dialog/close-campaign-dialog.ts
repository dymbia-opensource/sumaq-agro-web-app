import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { YieldUnit } from '../../../domain/model/entities/campaign-ledger.entity';

/** Data shown in the dialog. */
export interface CloseCampaignDialogData {
  season: string;
  yieldUnit: YieldUnit;
  /** Actual yield already recorded, if any. */
  actualYield: number | null;
}

/** Answer of the producer: the harvested yield, or `null` when it is not known yet. */
export interface CloseCampaignDialogResult {
  actualYield: number | null;
}

/**
 * Asks the producer to confirm the closing of a campaign and, optionally,
 * the yield harvested (`CloseCropCampaign`, `RecordActualYield`).
 */
@Component({
  selector: 'app-close-campaign-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './close-campaign-dialog.html',
  styleUrl: './close-campaign-dialog.css',
})
export class CloseCampaignDialog {
  protected readonly data = inject<CloseCampaignDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<CloseCampaignDialog, CloseCampaignDialogResult>>(MatDialogRef);

  protected readonly actualYield = new FormControl<number | null>(this.data.actualYield, [
    Validators.min(0.01),
  ]);

  protected onConfirm() {
    if (this.actualYield.invalid) {
      this.actualYield.markAsTouched();
      return;
    }
    this.dialogRef.close({ actualYield: this.actualYield.value || null });
  }
}
