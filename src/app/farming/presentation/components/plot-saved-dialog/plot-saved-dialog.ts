import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { FieldPlot } from '../../../domain/model/entities/field-plot.entity';

/** Data shown in the success dialog. */
export interface PlotSavedDialogData {
  plot: FieldPlot;
  seedVariety?: string;
  plotCount: number;
  plotQuota: number;
}

/** Where the producer wants to go after closing the dialog. */
export type PlotSavedDialogResult = 'crop-health' | 'plots';

/** Success dialog shown after saving the polygon (US-30). */
@Component({
  selector: 'app-plot-saved-dialog',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './plot-saved-dialog.html',
  styleUrl: './plot-saved-dialog.css',
})
export class PlotSavedDialog {
  protected readonly data = inject<PlotSavedDialogData>(MAT_DIALOG_DATA);
}
