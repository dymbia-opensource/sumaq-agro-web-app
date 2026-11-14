import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { SubscriptionsStore } from '../../../../subscriptions/application/subscriptions.store';
import { FarmingStore } from '../../../application/farming.store';

/** Plan usage indicator; an unavailable count is never presented as free capacity. */
@Component({
  selector: 'app-plot-quota-summary',
  imports: [TranslatePipe, MatButtonModule, MatProgressBarModule],
  templateUrl: './plot-quota-summary.html',
  styleUrl: './plot-quota-summary.css',
})
export class PlotQuotaSummary {
  readonly showRefresh = input(true);
  readonly store = inject(FarmingStore);
  private readonly subscriptions = inject(SubscriptionsStore);
  protected readonly checkingPlan = computed(() => this.subscriptions.loading());

  /** Explicitly retries the current producer's quota query without changing accounts. */
  refresh(): void {
    const owner = this.store.currentUserId();
    if (owner === null || this.store.loading() || this.checkingPlan()) return;

    this.store.reloadPlanPlotQuota();
    this.store.loadMyPlots(owner);
  }
}
