import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { IamStore } from '../../../../iam/application/iam.store';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { PaymentStatus } from '../../../domain/model/entities/payment-status';

/** Checkout summary and demo payment flow for a selected plan. */
@Component({
  selector: 'app-checkout',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MessageCard,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private readonly router = inject(Router);
  private readonly store = inject(SubscriptionsStore);
  private readonly iamStore = inject(IamStore);

  protected readonly dashboardRoute = computed(
    () => this.iamStore.activeUser()?.initialRoute ?? null,
  );

  readonly selectedPlan = this.store.selectedPlan;
  readonly cycle = this.store.billingCycle;
  readonly amount = this.store.checkoutAmount;
  readonly paymentResult = this.store.paymentResult;
  readonly processing = this.store.processing;
  readonly error = this.store.error;

  protected readonly paymentStatuses = PaymentStatus;
  protected readonly demoPaymentsEnabled = environment.demoCheckoutEnabled;

  /** Submits a demo payment using the current session identity. */
  onPay(status: PaymentStatus.COMPLETED | PaymentStatus.REJECTED): void {
    if (!this.demoPaymentsEnabled) return;

    const amount = this.amount();
    const userId = this.iamStore.activeUser()?.id ?? null;

    if (userId === null || !amount || !this.selectedPlan() || this.processing()) {
      return;
    }

    this.store.submitPayment(status, userId);
  }

  /** Leaves checkout and clears its transient state. */
  onReturnToCatalog(): void {
    this.store.resetCheckout();
    void this.router.navigate(['/subscriptions/plans']);
  }
}
