import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { BillingCycle } from '../../../domain/model/entities/billing-cycle';
import { Plan } from '../../../domain/model/entities/plan.entity';

/** Displays one subscription plan and emits the user's selection. */
@Component({
  selector: 'app-plan-card',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './plan-card.html',
  styleUrl: './plan-card.css',
})
export class PlanCard {
  protected readonly billingCycles = BillingCycle;

  /** Plan and billing cycle shown in the card. */
  readonly plan = input.required<Plan>();
  readonly cycle = input.required<BillingCycle>();

  /** Indicates whether this plan is active or selected for checkout. */
  readonly current = input(false);
  readonly selected = input(false);

  /** Disables selection while catalog data is loading. */
  readonly disabled = input(false);

  /** The user wants to select this plan. */
  readonly choose = output<Plan>();
}
