import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import type { UserRole } from '../../../../iam/domain/model/value-objects/user-role';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { SelectSubscriptionPlanCommand } from '../../../domain/model/commands/select-subscription-plan.command';
import { BillingCycle } from '../../../domain/model/entities/billing-cycle';
import { Plan } from '../../../domain/model/entities/plan.entity';
import {
  planForSegment,
  type SubscriptionSegment,
} from '../../../domain/model/value-objects/subscription-segment';
import { PlanCard } from '../../components/plan-card/plan-card';

/** Mapping of user roles to subscription segments. */
const SEGMENT_BY_ROLE: Readonly<Record<UserRole, SubscriptionSegment>> = {
  FARMER: 'INDEPENDENT_FARMER',
  COOPERATIVE_DIRECTOR: 'COOPERATIVE',
  AGRONOMIST: 'TECHNICAL_ADVISOR',
};

/** Catalog of available subscription plans and their billing cycles. */
@Component({
  selector: 'app-plans-catalog-view',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressBarModule,
    MessageCard,
    PlanCard,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './plans-catalog-view.html',
  styleUrl: './plans-catalog-view.css',
})
export class PlansCatalogView {
  private readonly router = inject(Router);
  private readonly store = inject(SubscriptionsStore);
  private readonly iamStore = inject(IamStore);

  readonly plans = computed(() => {
    const user = this.iamStore.activeUser();
    if (!user) return [];

    const allowedPlanCode = planForSegment(SEGMENT_BY_ROLE[user.experience]);
    return this.store.plans().filter((plan) => plan.code === allowedPlanCode);
  });
  readonly subscription = this.store.subscription;
  readonly selectedPlan = this.store.selectedPlan;
  readonly currentUserId = computed(() => this.iamStore.activeUser()?.id ?? null);
  readonly cycle = this.store.billingCycle;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  protected readonly accessCheckFailed = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map((params) => params.get('accessCheck') === 'failed'),
    ),
    { initialValue: false },
  );

  /** Billing cycles offered by the catalog toggle. */
  protected readonly cycles = BillingCycle;

  /** `true` when the plan has a saving to advertise on the Annual option. */
  protected readonly hasAnnualSavings = computed(
    () => (this.plans()[0]?.annualSavings().amount ?? 0) > 0,
  );

  constructor() {
    const userId = this.currentUserId();
    // Load both the catalog and the current subscription to highlight its plan.
    if (userId !== null) this.store.loadMySubscription(userId);
  }

  /** Updates the cycle selected for displaying plan prices. */
  onCycleChange(cycle: BillingCycle): void {
    if (cycle !== this.cycle()) this.store.toggleBillingCycle();
  }

  /** Requests checkout for the plan chosen in the catalog. */
  onSelectPlan(plan: Plan): void {
    const user = this.iamStore.activeUser();
    if (!user) return;

    const accepted = this.store.selectPlan(
      new SelectSubscriptionPlanCommand({
        userId: user.id,
        planCode: plan.code,
        billingCycle: this.cycle(),
      }),
      SEGMENT_BY_ROLE[user.experience],
    );

    if (accepted) {
      void this.router.navigate(['/subscriptions/checkout']);
    }
  }
}
