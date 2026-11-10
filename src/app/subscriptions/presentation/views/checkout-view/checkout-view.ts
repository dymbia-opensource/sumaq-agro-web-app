import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { ApplyCouponCommand } from '../../../domain/model/commands/apply-coupon.command';
import { SubmitPaymentCommand } from '../../../domain/model/commands/submit-payment.command';
import { PaymentStatus } from '../../../domain/model/entities/payment-status';
import { CouponForm } from '../../components/coupon-form/coupon-form';
import { IamStore } from '../../../../iam/application/iam.store';

/** Checkout summary and demo payment flow for a selected plan. */
@Component({
  selector: 'app-checkout-view',
  imports: [
    CouponForm,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MessageCard,
    PageHeader,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './checkout-view.html',
  styleUrl: './checkout-view.css',
})
export class CheckoutView {
  private readonly router = inject(Router);
  private readonly store = inject(SubscriptionsStore);
  private readonly iamStore = inject(IamStore);

  protected readonly dashboardRoute = computed(
    () => this.iamStore.activeUser()?.initialRoute ?? null,
  );

  readonly selectedPlan = this.store.selectedPlan;
  readonly cycle = this.store.billingCycle;
  readonly amount = this.store.checkoutAmount;
  readonly coupon = this.store.coupon;
  readonly subscription = this.store.subscription;
  readonly paymentResult = this.store.paymentResult;
  readonly processing = this.store.processing;
  readonly error = this.store.error;

  protected readonly paymentStatuses = PaymentStatus;
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'subscriptions.catalog.title', link: '/subscriptions/plans' },
    { label: 'subscriptions.checkout.title' },
  ];

  /** Returns a numeric subscription id expected by the payment commands. */
  private subscriptionId(): number | null {
    const id = this.subscription()?.id;
    if (typeof id === 'number') return id;
    if (typeof id === 'string' && id.trim() !== '') {
      const parsed = Number(id);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  /** Applies a coupon through the subscriptions store. */
  onApplyCoupon(code: string): void {
    this.store.applyCoupon(
      new ApplyCouponCommand({
        subscriptionId: this.subscriptionId(),
        couponCode: code,
      }),
    );
  }

  /** Submits a demo payment using the current session identity. */
  onPay(status: PaymentStatus.COMPLETED | PaymentStatus.REJECTED): void {
    const amount = this.amount();
    const userId = this.iamStore.activeUser()?.id ?? null;

    if (
      userId === null ||
      !amount ||
      !this.selectedPlan() ||
      this.processing()
    ) {
      return;
    }

    this.store.submitPayment(
      new SubmitPaymentCommand({
        subscriptionId: this.subscriptionId(),
        cardToken: 'demo-payment-token',
        amount,
        simulatedStatus: status,
      }),
      userId,
    );
  }

  /** Leaves checkout and clears its transient state. */
  onReturnToCatalog(): void {
    this.store.resetCheckout();
    void this.router.navigate(['/subscriptions/plans']);
  }
}
