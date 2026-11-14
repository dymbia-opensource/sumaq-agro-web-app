import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';
import { CropCampaign } from '../../../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../../../domain/model/entities/field-plot.entity';

/** Card of one registered plot: status, crop, area and location (US-28). */
@Component({
  selector: 'app-plot-card',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    TranslatePipe,
  ],
  templateUrl: './plot-card.html',
  styleUrl: './plot-card.css',
})
export class PlotCard {
  /** The plot shown in the card. */
  readonly plot = input.required<FieldPlot>();

  /** Current campaign of the plot, if it has one. */
  readonly campaign = input<CropCampaign>();

  /** Position of the plot in the plan (1, 2, 3...). */
  readonly position = input.required<number>();

  /** The producer wants to see the plot on the dashboard. */
  readonly viewOnDashboard = output<FieldPlot>();

  /** The producer wants to see the satellite monitoring of the plot. */
  readonly viewMonitoring = output<FieldPlot>();

  /** The producer wants to mark the polygon of the plot. */
  readonly delineate = output<FieldPlot>();

  /** The producer wants to see the map and cadastral data of the plot. */
  readonly viewDetail = output<FieldPlot>();

  /** The producer wants to record the soil analysis of the plot. */
  readonly recordSoil = output<FieldPlot>();

  /** Prevents overlapping plot mutations or deletion before ownership has loaded. */
  readonly deletionDisabled = input(false);

  /** The producer wants to delete the plot. */
  readonly remove = output<FieldPlot>();
}
