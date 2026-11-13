import { FarmerAdvisoryPanel } from '../../../../profiles/presentation/components/farmer-advisory-panel/farmer-advisory-panel';
import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import {
  Breadcrumb,
  PageHeader,
} from '../../../../shared/presentation/components/page-header/page-header';
import { FieldManagementStore } from '../../../application/field-management.store';
import { PlotCadastreCard } from '../../components/plot-cadastre-card/plot-cadastre-card';
import { PlotPolygonViewer } from '../../components/plot-polygon-viewer/plot-polygon-viewer';
import { SoilBaselineCard } from '../../components/soil-baseline-card/soil-baseline-card';

/**
 * Detail of a plot: satellite map with its polygon, cadastral data and soil
 * analysis (`SatelliteMapAndCadastreViewer` read model).
 */
@Component({
  selector: 'app-plot-detail-view',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    PlotPolygonViewer,
    PlotCadastreCard,
    SoilBaselineCard,
    FarmerAdvisoryPanel,
  ],
  templateUrl: './plot-detail-view.html',
  styleUrl: './plot-detail-view.css',
})
export class PlotDetailView {
  private readonly router = inject(Router);
  private readonly store = inject(FieldManagementStore);

  /** ID taken from the route `plots/:id`. */
  readonly id = input.required({ transform: numberAttribute });

  // Store state
  readonly loading = this.store.loading;
  readonly plotsLoading = this.store.plotsLoading;
  readonly error = this.store.error;
  readonly plot = computed(() => this.store.getPlotById(this.id())());
  readonly campaign = computed(() => this.store.getCurrentCampaignOf(this.id())());

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.my-plot', link: '/dashboard' },
    { label: 'field-management.plots.manage', link: '/field-management/plots' },
    { label: 'field-management.plot-detail.title' },
  ];

  // Actions
  onViewOnDashboard() {
    this.store.selectPlot(this.id());
    this.router.navigate(['/dashboard']).then();
  }
}
