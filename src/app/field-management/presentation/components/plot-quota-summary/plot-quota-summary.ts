import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { PlanCode } from '../../../../subscriptions/domain/model/entities/plan-code';
import { SubscriptionsApi } from '../../../../subscriptions/infrastructure/subscriptions-api';
import { FieldManagementStore } from '../../../application/field-management.store';

/** Shared Seed-plan usage indicator; an unavailable count is never presented as free capacity. */
@Component({
  selector: 'app-plot-quota-summary',
  imports: [TranslatePipe, MatButtonModule, MatProgressBarModule],
  templateUrl: './plot-quota-summary.html',
  styleUrl: './plot-quota-summary.css',
})
export class PlotQuotaSummary {
  readonly store = inject(FieldManagementStore);
  private readonly subscriptionsApi = inject(SubscriptionsApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly checkingPlan = signal(false);

  constructor() {
    const owner = this.store.currentUserId();
    if (owner !== null) this.loadPlanQuota(owner);
  }

  /** Explicitly retries the current producer's quota query without changing accounts. */
  refresh(): void {
    const owner = this.store.currentUserId();
    if (owner === null || this.store.loading() || this.checkingPlan()) return;

    this.loadPlanQuota(owner);
    this.store.loadMyPlots(owner);
  }

  private loadPlanQuota(owner: number): void {
    this.store.setPlanPlotQuota(owner, null);
    this.checkingPlan.set(true);

    forkJoin({
      subscription: this.subscriptionsApi.getSubscriptionByUserId(owner),
      plans: this.subscriptionsApi.getPlans(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ subscription, plans }) => {
          const seedPlan = plans.find(
            (plan) => plan.id === subscription?.planId && plan.code === PlanCode.SEED,
          );

          if (subscription?.userId === owner && subscription.hasAccess() && seedPlan) {
            this.store.setPlanPlotQuota(owner, seedPlan.plotQuota);
          }

          this.checkingPlan.set(false);
        },
        error: () => this.checkingPlan.set(false),
      });
  }
}
