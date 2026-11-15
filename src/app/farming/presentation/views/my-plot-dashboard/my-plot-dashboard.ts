import { Component, computed, effect, inject, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { CropStore } from '../../../../crop/application/crop.store';
import {
  Breadcrumb,
  PageHeader,
} from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { FarmingStore } from '../../../application/farming.store';
import { CampaignKpiCards } from '../../components/campaign-kpi-cards/campaign-kpi-cards';
import { CostDistributionCard } from '../../components/cost-distribution-card/cost-distribution-card';
import { NdviChartCard } from '../../components/ndvi-chart-card/ndvi-chart-card';

/** "My Plot": start page of the producer with costs, breakeven price and NDVI (US-16 to US-19). */
@Component({
  selector: 'app-my-plot-dashboard',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    CampaignKpiCards,
    NdviChartCard,
    CostDistributionCard,
  ],
  templateUrl: './my-plot-dashboard.html',
  styleUrl: './my-plot-dashboard.css',
})
export class MyPlotDashboard {
  private readonly store = inject(FarmingStore);
  private readonly session = inject(IamStore);
  private readonly cropStore = inject(CropStore);

  // Store state
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly plots = this.store.plots;
  readonly plot = this.store.selectedPlot;
  readonly campaign = this.store.activeCampaign;
  readonly ledger = this.store.ledger;

  // NDVI of the selected plot: Crop Health loads it (both contexts share the selected plot).
  /** Satellite observations of the selected plot, oldest first. */
  readonly observations = computed(() => [...this.cropStore.observations()].reverse());
  readonly latestObservation = computed(() => this.observations().at(-1));
  readonly observationsLoading = this.cropStore.observationsLoading;
  readonly observationsError = computed(() => !!this.cropStore.observationsError());

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [];
  readonly userName = computed(() => this.session.activeUser()?.displayName ?? '');

  /** Greeting by time of day: morning, afternoon or evening. */
  readonly greetingKey = computed(() => {
    if (!this.userName()) return 'farming.dashboard.welcome';

    const hour = new Date().getHours();
    if (hour < 12) return 'farming.dashboard.good-morning';
    if (hour < 19) return 'farming.dashboard.good-afternoon';
    return 'farming.dashboard.good-evening';
  });

  /** Subtitle, e.g. "Pampa Alta – Papa Yungay (2.5 Ha)". */
  readonly plotSummary = computed(() => {
    const plot = this.plot();
    if (!plot) return '';
    const variety = this.campaign()?.seedVariety;
    const area = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
      plot.areaHectares,
    );
    return `${plot.name}${variety ? ` – ${variety}` : ''} (${area} Ha)`;
  });

  constructor() {
    effect(() => {
      const plot = this.cropStore.selectedPlot();
      untracked(() => {
        if (plot) this.cropStore.loadObservations(plot.id as number);
      });
    });
  }

  // Actions
  retry(): void {
    const userId = this.store.currentUserId();
    if (userId !== null) {
      this.store.loadMyPlots(userId);
    }
  }
}
