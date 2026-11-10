import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Money } from '../../shared/domain/model/money';
import { FileDownloader } from '../../shared/infrastructure/file-downloader';
import { ApplyCouponCommand } from '../domain/model/commands/apply-coupon.command';
import { CancelSubscriptionCommand } from '../domain/model/commands/cancel-subscription.command';
import { SelectSubscriptionPlanCommand } from '../domain/model/commands/select-subscription-plan.command';
import { SubmitPaymentCommand } from '../domain/model/commands/submit-payment.command';
import { BillingCycle } from '../domain/model/entities/billing-cycle';
import { Payment } from '../domain/model/entities/payment.entity';
import { PaymentStatus } from '../domain/model/entities/payment-status';
import { Plan } from '../domain/model/entities/plan.entity';
import { Subscription } from '../domain/model/entities/subscription.entity';
import { SubscriptionsApi } from '../infrastructure/subscriptions-api';

/** Result of the last payment attempt, shown in the last step of the checkout. */
export type PaymentResult = PaymentStatus.COMPLETED | PaymentStatus.REJECTED;

/** Promotional code accepted for the current checkout. */
export interface AppliedCoupon {
  code: string;
  discountPercent: number;
}

/**
 * Holds the Subscriptions and Payments state and coordinates its behavior.
 *
 * @remarks
 * The views send commands and read signals. Every change is applied to a copy
 * of the subscription; the shown state is only updated when the API confirms.
 * Policy P2 belongs to the backend; it is simulated here until the RESTful API exists.
 */
@Injectable()
export class SubscriptionsStore {
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptionsApi = inject(SubscriptionsApi);
  private readonly fileDownloader = inject(FileDownloader);

  // Store state
  private readonly plansSignal = signal<Plan[]>([]);
  private readonly subscriptionSignal = signal<Subscription | null>(null);
  private readonly paymentsSignal = signal<Payment[]>([]);
  private readonly billingCycleSignal = signal<BillingCycle>(BillingCycle.MONTHLY);
  private readonly selectedPlanSignal = signal<Plan | null>(null);
  private readonly couponSignal = signal<AppliedCoupon | null>(null);
  private readonly paymentResultSignal = signal<PaymentResult | null>(null);
  private readonly loadedSignal = signal(false);

  // UI state
  private readonly loadingSignal = signal(false);
  private readonly processingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  /** Plans of the catalog. */
  readonly plans: Signal<Plan[]> = this.plansSignal.asReadonly();
  /** Subscription of the signed-in user, with its plan completed, or `null` if never paid. */
  readonly subscription: Signal<Subscription | null> = this.subscriptionSignal.asReadonly();
  /** Payments of the subscription, newest first. */
  readonly payments: Signal<Payment[]> = this.paymentsSignal.asReadonly();
  /** Billing cycle chosen in the catalog. */
  readonly billingCycle: Signal<BillingCycle> = this.billingCycleSignal.asReadonly();
  /** Plan chosen to pay, or `null`. */
  readonly selectedPlan: Signal<Plan | null> = this.selectedPlanSignal.asReadonly();
  /** Coupon applied to the current checkout, or `null`. */
  readonly coupon: Signal<AppliedCoupon | null> = this.couponSignal.asReadonly();
  /** Result of the last payment attempt, or `null`. */
  readonly paymentResult: Signal<PaymentResult | null> = this.paymentResultSignal.asReadonly();
  /** `true` while data is being loaded. */
  readonly loading = this.loadingSignal.asReadonly();
  /** `true` while a payment or a cancellation is being processed. */
  readonly processing = this.processingSignal.asReadonly();
  /** i18n key of the last error, or `null`. */
  readonly error = this.errorSignal.asReadonly();
  /** Signed-in user who owns the subscription. */
  /** `true` when the user has a paid plan with access (active, or cancelled but not yet expired). */
  readonly hasActivePlan = computed(() => this.subscriptionSignal()?.hasAccess() ?? false);
  /** Plan the user can use now, or `null` when the user has not paid or the plan expired. */

  readonly currentPlan = computed<Plan | null>(() => {
    const subscription = this.subscriptionSignal();
    return subscription?.hasAccess() ? subscription.plan : null;
  });

  /** Plots the user can register. It is 0 without a plan. Field Management reads this value. */
  readonly plotQuota = computed(() => this.currentPlan()?.plotQuota ?? 0);

  /** `true` once the subscription was loaded, so a quota of 0 is not shown by mistake. */
  readonly plotQuotaReady: Signal<boolean> = this.loadedSignal.asReadonly();

  /** Amount of the selected plan for the chosen cycle, with the coupon discount. */
  readonly checkoutAmount = computed<Money | null>(() => {
    const plan = this.selectedPlanSignal();
    if (!plan) return null;
    const price = plan.priceFor(this.billingCycleSignal());
    const discount = this.couponSignal()?.discountPercent ?? 0;
    const discounted = Math.round(price.amount * (1 - discount / 100) * 100) / 100;
    return new Money(discounted, price.currency);
  });

  // Actions

  /** Loads the plans of the catalog. */
  loadPlans = (): void => {
    this.startLoading();
    this.subscriptionsApi
      .getPlans()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plans) => {
          this.plansSignal.set(plans);
          this.loadingSignal.set(false);
        },
        error: (error) => this.fail(error, 'subscriptions.errors.load-plans'),
      });
  };

  /**
   * Loads the subscription of a user and its payments.
   * A user who never paid has no subscription: `subscription()` stays `null`.
   * @param userId - Owner of the subscription.
   */
  loadMySubscription = (userId: number): void => {
    this.startLoading();
    forkJoin({
      plans: this.subscriptionsApi.getPlans(),
      subscription: this.subscriptionsApi.getSubscriptionByUserId(userId),
    })
      .pipe(
        switchMap(({ plans, subscription }) => {
          const ready = subscription ? this.withPlan(subscription, plans) : null;
          const payments$: Observable<Payment[]> = ready
            ? this.subscriptionsApi.getPayments(ready.id as number)
            : of([]);
          return payments$.pipe(map((payments) => ({ plans, ready, payments })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ plans, ready, payments }) => {
          this.plansSignal.set(plans);
          this.subscriptionSignal.set(ready);
          this.paymentsSignal.set(this.newestFirst(payments));
          this.loadedSignal.set(true);
          this.loadingSignal.set(false);
        },
        error: (error) => this.fail(error, 'subscriptions.errors.load-subscription'),
      });
  };

  /**
   * Chooses a plan and a cycle to go to the payment.
   * @param command - Plan and billing cycle chosen by the user.
   */
  selectPlan = (command: SelectSubscriptionPlanCommand): void => {
    const plan = this.plansSignal().find((candidate) => candidate.code === command.planCode);
    if (!plan || !Number.isSafeInteger(command.userId) || command.userId <= 0) {
      this.errorSignal.set('subscriptions.errors.select-plan');
      return;
    }
    this.errorSignal.set(null);
    this.paymentResultSignal.set(null);
    this.couponSignal.set(null);
    this.billingCycleSignal.set(command.billingCycle);
    this.selectedPlanSignal.set(plan);
  };

  /** Switches the catalog between monthly and annual prices. */
  toggleBillingCycle = (): void =>
    this.billingCycleSignal.update((cycle) =>
      cycle === BillingCycle.MONTHLY ? BillingCycle.ANNUAL : BillingCycle.MONTHLY,
    );

  /**
   * Applies a promotional code to the amount to pay.
   * @param command - Code typed by the user.
   */
  applyCoupon = (command: ApplyCouponCommand): void => {
    if (!this.selectedPlanSignal()) return;
    this.errorSignal.set(null);
    this.subscriptionsApi
      .getCouponDiscount(command.couponCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (discountPercent) => {
          if (discountPercent === null) {
            this.couponSignal.set(null);
            this.errorSignal.set('subscriptions.errors.invalid-coupon');
            return;
          }
          this.couponSignal.set({ code: command.couponCode.trim().toUpperCase(), discountPercent });
        },
        error: (error) => this.fail(error, 'subscriptions.errors.invalid-coupon'),
      });
  };

  /**
   * Sends the payment of the selected plan.
   *
   * @remarks
   * The first approved payment creates the subscription; later ones change the
   * plan of the existing one. A rejected payment never changes the plan, and
   * it is only saved in the history when the user already has a subscription.
   * The card number never arrives here, only its token.
   * Temporary, until the backend exists: it simulates P2 (an approved payment
   * activates the plan) because Niubiz confirms it on the server.
   * @param userId - Current user identifier supplied by the container view.
   */
  submitPayment = (command: SubmitPaymentCommand, userId: number): void => {
    const plan = this.selectedPlanSignal();
    const current = this.subscriptionSignal();

    if (!plan || !Number.isSafeInteger(userId) || userId <= 0 || this.processingSignal()) {
      return;
    }

    if (current && current.userId !== userId) return;
    if (command.subscriptionId !== (current?.id ?? null)) return;

    const status: PaymentResult = command.simulatedStatus ?? PaymentStatus.COMPLETED;
    this.processingSignal.set(true);
    this.errorSignal.set(null);

    this.chargeAndActivate(userId, plan, current, command, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ subscription, payment }) => {
          if (subscription) {
            subscription.plan = plan;
            this.subscriptionSignal.set(subscription);
            this.selectedPlanSignal.set(null);
            this.couponSignal.set(null);
          }
          if (payment) this.paymentsSignal.update((payments) => [payment, ...payments]);
          this.paymentResultSignal.set(status);
          this.processingSignal.set(false);
        },
        error: (error) => {
          this.processingSignal.set(false);
          this.fail(error, 'subscriptions.errors.payment');
        },
      });
  };

  /**
   * Stops the renewal; the access stays until the end date.
   * @param command - Subscription to cancel.
   */
  cancelSubscription = (command: CancelSubscriptionCommand): void => {
    const subscription = this.subscriptionSignal();
    if (!subscription || subscription.id !== command.subscriptionId || this.processingSignal()) {
      return;
    }
    const cancelled = subscription.copy();
    try {
      cancelled.cancel();
    } catch (error) {
      this.fail(error, 'subscriptions.errors.cancel');
      return;
    }
    this.processingSignal.set(true);
    this.errorSignal.set(null);
    this.subscriptionsApi
      .updateSubscription(cancelled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          saved.plan = subscription.plan;
          this.subscriptionSignal.set(saved);
          this.processingSignal.set(false);
        },
        error: (error) => {
          this.processingSignal.set(false);
          this.fail(error, 'subscriptions.errors.cancel');
        },
      });
  };

  /**
   * Downloads the receipt of a payment.
   * @param paymentId - Payment of the receipt.
   */
  downloadReceipt = (paymentId: number): void => {
    const payment = this.paymentsSignal().find((candidate) => candidate.id === paymentId);
    if (!payment) {
      this.errorSignal.set('subscriptions.errors.receipt');
      return;
    }
    const planName = this.subscriptionSignal()?.plan?.name ?? '';
    this.fileDownloader.save(this.subscriptionsApi.buildReceipt(payment, planName));
  };

  /** Clears the checkout (selected plan, coupon and result) when the user leaves it. */
  resetCheckout = (): void => {
    this.selectedPlanSignal.set(null);
    this.couponSignal.set(null);
    this.paymentResultSignal.set(null);
    this.errorSignal.set(null);
  };

  // Private helpers

  /**
   * Activates the plan when the payment is approved and saves the payment.
   * The subscription is saved first because the payment needs its id.
   */
  private chargeAndActivate(
    userId: number,
    plan: Plan,
    current: Subscription | null,
    command: SubmitPaymentCommand,
    status: PaymentResult,
  ): Observable<{ subscription: Subscription | null; payment: Payment | null }> {
    if (status === PaymentStatus.REJECTED) {
      if (!current) return of({ subscription: null, payment: null });
      return this.subscriptionsApi
        .createPayment(this.newPayment(current.id as number, command.amount, status))
        .pipe(map((payment) => ({ subscription: null, payment })));
    }

    const today = new Date();
    const cycle = this.billingCycleSignal();
    let subscription$: Observable<Subscription>;
    if (current) {
      const renewed = current.copy();
      renewed.changePlan(plan, cycle, today);
      subscription$ = this.subscriptionsApi.updateSubscription(renewed);
    } else {
      const created = Subscription.start({ userId, plan, billingCycle: cycle, startDate: today });
      subscription$ = this.subscriptionsApi.createSubscription(created);
    }
    return subscription$.pipe(
      switchMap((subscription) =>
        this.subscriptionsApi
          .createPayment(this.newPayment(subscription.id as number, command.amount, status))
          .pipe(map((payment) => ({ subscription, payment }))),
      ),
    );
  }

  private newPayment(subscriptionId: number, amount: Money, status: PaymentResult): Payment {
    return new Payment({
      id: 0,
      subscriptionId,
      amount,
      transactionToken: `demo-tx-${Date.now()}`,
      status,
      paidAt: new Date(),
    });
  }

  /** Completes the plan of a subscription from the catalog. */
  private withPlan(subscription: Subscription, plans: Plan[]): Subscription {
    subscription.plan = plans.find((plan) => plan.id === subscription.planId) ?? null;
    return subscription;
  }

  private newestFirst(payments: Payment[]): Payment[] {
    return [...payments].sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
  }

  private startLoading(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
  }

  /**
   * Normalizes an error into an i18n key to show it in the view.
   * @param error - Source error.
   * @param fallbackKey - i18n key of the failed operation.
   */
  private fail(error: unknown, fallbackKey: string): void {
    console.error(error);
    const isKey = error instanceof Error && error.message.startsWith('subscriptions.');
    const key = isKey ? (error as Error).message : fallbackKey;
    this.errorSignal.set(key);
    this.loadingSignal.set(false);
  }
}
