import { CropPlotSelector } from '../../components/plot-selector/plot-selector';
import { DatePipe } from '@angular/common';
import { Component, effect, inject, untracked } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { CropHealthStore } from '../../../application/crop-health.store';

/**
 * Agroclimatic Alerts View.
 *
 * @remarks
 * Lists all active weather and environmental alerts for the user's region.
 * Severity levels are reflected through CSS classes for visual distinction.
 */
@Component({
  selector: 'app-agricultural-alerts-view',
  imports: [CropPlotSelector, DatePipe, TranslatePipe, MatIconModule, MatProgressBarModule, PageHeader],
  templateUrl: './agricultural-alerts-view.html',
  styleUrl: './agricultural-alerts-view.css',
})
export class AgriculturalAlertsView {
  /** Application store that holds all crop-health signals. */
  readonly store = inject(CropHealthStore);

  protected reloadAlerts(): void {
    const plot = this.store.selectedPlot();
    if (plot) this.store.loadAlerts(plot.region);
  }

  /** Loads agroclimatic alerts for the user's region on component init. */
  constructor() {
    effect(() => {
      const plot = this.store.selectedPlot();
      untracked(() => { if (plot) this.store.loadAlerts(plot.region); });
    });
  }
}
