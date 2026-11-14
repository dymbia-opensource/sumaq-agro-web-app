import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { CropCampaign } from '../../../domain/model/entities/crop-campaign.entity';
import { FieldPlot, GeoCoordinate } from '../../../domain/model/entities/field-plot.entity';

/** Status of the polygon being marked. */
export type PolygonStatus = 'OPEN' | 'CLOSED' | 'CROSSED';

/** Icon of the status chip for each polygon status. */
const STATUS_ICONS: Record<PolygonStatus, string> = {
  OPEN: 'radio_button_unchecked',
  CLOSED: 'check_circle',
  CROSSED: 'warning',
};

/** Summary next to the map: corners, area and polygon status (US-29). */
@Component({
  selector: 'app-boundary-summary-panel',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './boundary-summary-panel.html',
  styleUrl: './boundary-summary-panel.css',
})
export class BoundarySummaryPanel {
  /** Plot being delineated. */
  readonly plot = input<FieldPlot>();

  /** Campaign of the plot, to show its crop. */
  readonly campaign = input<CropCampaign>();

  /** Vertices marked on the map, in order. */
  readonly coordinates = input.required<GeoCoordinate[]>();

  /** Area of the marked polygon. */
  readonly areaHectares = input.required<number>();

  /** Open, closed or crossed polygon. */
  readonly status = input.required<PolygonStatus>();

  /** `true` while the polygon is being saved. */
  readonly saving = input(false);

  /** Removes the last vertex. */
  readonly undo = output<void>();

  /** Removes every vertex. */
  readonly clear = output<void>();

  /** Saves the polygon. */
  readonly save = output<void>();

  protected readonly statusIcon = computed(() => STATUS_ICONS[this.status()]);
}
