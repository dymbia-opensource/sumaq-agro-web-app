import { Component, inject,computed  } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { SelectSubscriptionPlanCommand } from '../../../domain/model/commands/select-subscription-plan.command';
import { BillingCycle } from '../../../domain/model/entities/billing-cycle';
import { Plan } from '../../../domain/model/entities/plan.entity';
import { PlanCard } from '../../components/plan-card/plan-card';
import { IamStore } from '../../../../iam/application/iam.store';

/** Catalog of available subscription plans and their billing cycles. */
@Component({
  selector: 'app-plans-catalog-view',
  imports: [
    MatButtonToggleModule,
    MatProgressBarModule,
    MessageCard,
    PageHeader,
    PlanCard,
    TranslatePipe,
  ],
  templateUrl: './plans-catalog-view.html',
  styleUrl: './plans-catalog-view.css',
})
export class PlansCatalogView {
  private readonly router = inject(Router);
  private readonly store = inject(SubscriptionsStore);
  private readonly iamStore = inject(IamStore);

  readonly plans = this.store.plans;
  readonly subscription = this.store.subscription;
  readonly selectedPlan = this.store.selectedPlan;
  readonly currentUserId = computed(() => this.iamStore.activeUser()?.id ?? null);
  readonly cycle = this.store.billingCycle;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  /** Billing cycles offered by the catalog toggle. */
  protected readonly cycles = BillingCycle;

  /** Breadcrumb path for the catalog page. */
  protected readonly breadcrumbs: Breadcrumb[] = [{ label: 'subscriptions.catalog.title' }];

  constructor() {
    const userId = this.currentUserId();
    // Load both the catalog and the current subscription to highlight its plan.
    if (userId !== null) this.store.loadMySubscription(userId);
  }

  /** Updates the cycle selected for displaying plan prices. */
  onCycleChange(cycle: BillingCycle): void {
    if (cycle !== this.cycle()) this.store.toggleBillingCycle();
  }

  /** Creates the selection command for the signed-in user. */
  onSelectPlan(plan: Plan): void {
    const userId = this.currentUserId();
    if (userId === null) return;

    this.store.selectPlan(
      new SelectSubscriptionPlanCommand({
        userId,
        planCode: plan.code,
        billingCycle: this.cycle(),
      }),
    );
    if (this.store.selectedPlan()?.code === plan.code) {
      void this.router.navigate(['/subscriptions/checkout']);
    }
  }
}
