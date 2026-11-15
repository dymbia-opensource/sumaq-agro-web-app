import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { FileDownloader } from '../../shared/infrastructure/file-downloader';
import { CancelSubscriptionCommand } from '../domain/model/commands/cancel-subscription.command';
import { SelectSubscriptionPlanCommand } from '../domain/model/commands/select-subscription-plan.command';
import { BillingCycle } from '../domain/model/entities/billing-cycle';
import { Payment } from '../domain/model/entities/payment.entity';
import { PaymentStatus } from '../domain/model/entities/payment-status';
import { Plan } from '../domain/model/entities/plan.entity';
import { Subscription } from '../domain/model/entities/subscription.entity';
import { SubscriptionsApi } from '../infrastructure/subscriptions-api';
import {
  planForSegment,
  type SubscriptionSegment,
} from '../domain/model/entities/subscription-segment';

/** Result of the last payment attempt, shown in the last step of the checkout. */
export type PaymentResult = PaymentStatus.COMPLETED | PaymentStatus.REJECTED;

/**
 * Holds the Subscriptions and Payments state and coordinates its behavior.
 *
 * @remarks
 * Updates subscription and payment state from the API.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionsStore {
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptionsApi = inject(SubscriptionsApi);
  private readonly fileDownloader = inject(FileDownloader);
  private readonly iam = inject(IamStore);
  private subscriptionRequest = 0;
  private loadedUserId: number | null = null;

  // Store state
  private readonly plansSignal = signal<Plan[]>([]);
  private readonly subscriptionSignal = signal<Subscription | null>(null);
  private readonly paymentsSignal = signal<Payment[]>([]);
  private readonly billingCycleSignal = signal<BillingCycle>(BillingCycle.MONTHLY);
  private readonly selectedPlanSignal = signal<Plan | null>(null);
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
  /** Result of the last payment attempt, or `null`. */
  readonly paymentResult: Signal<PaymentResult | null> = this.paymentResultSignal.asReadonly();
  /** `true` while data is being loaded. */
  readonly loading = this.loadingSignal.asReadonly();
  /** `true` while a payment or a cancellation is being processed. */
  readonly processing = this.processingSignal.asReadonly();
  /** i18n key of the last error, or `null`. */
  readonly error = this.errorSignal.asReadonly();
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

  /** Amount quoted by the catalog for the selected billing cycle. */
  readonly checkoutAmount = computed(
    () => this.selectedPlanSignal()?.priceFor(this.billingCycleSignal()) ?? null,
  );

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
    if (this.iam.activeUser()?.id !== userId) return;
    const request = ++this.subscriptionRequest;
    if (this.loadedUserId !== userId) {
      this.loadedSignal.set(false);
      this.subscriptionSignal.set(null);
      this.paymentsSignal.set([]);
    }
    this.startLoading();
    forkJoin({
      plans: this.subscriptionsApi.getPlans(),
      subscription: this.subscriptionsApi.getMySubscription(),
      payments: this.subscriptionsApi.getMyPayments(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ plans, subscription, payments }) => {
          if (request !== this.subscriptionRequest || this.iam.activeUser()?.id !== userId) return;
          this.plansSignal.set(plans);
          this.subscriptionSignal.set(subscription ? this.withPlan(subscription, plans) : null);
          this.paymentsSignal.set(payments);
          this.loadedUserId = userId;
          this.loadedSignal.set(true);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          if (request !== this.subscriptionRequest || this.iam.activeUser()?.id !== userId) return;
          this.fail(error, 'subscriptions.errors.load-subscription');
        },
      });
  };

  /** Selects an eligible plan and returns whether checkout can continue. */
  selectPlan = (command: SelectSubscriptionPlanCommand, segment: SubscriptionSegment): boolean => {
    const plan = this.plansSignal().find((candidate) => candidate.code === command.planCode);

    if (
      !plan ||
      plan.code !== planForSegment(segment) ||
      !Number.isSafeInteger(command.userId) ||
      command.userId <= 0
    ) {
      this.errorSignal.set('subscriptions.errors.select-plan');
      return false;
    }

    this.errorSignal.set(null);
    this.paymentResultSignal.set(null);
    this.billingCycleSignal.set(command.billingCycle);
    this.selectedPlanSignal.set(plan);
    return true;
  };

  /** Switches the catalog between monthly and annual prices. */
  toggleBillingCycle = (): void =>
    this.billingCycleSignal.update((cycle) =>
      cycle === BillingCycle.MONTHLY ? BillingCycle.ANNUAL : BillingCycle.MONTHLY,
    );

  /** Submits a demo payment and refreshes the data recorded by Spring. */
  submitPayment = (outcome: PaymentResult, userId: number): void => {
    const plan = this.selectedPlanSignal();
    if (!plan || this.iam.activeUser()?.id !== userId || this.processingSignal()) return;

    this.processingSignal.set(true);
    this.paymentResultSignal.set(null);
    this.errorSignal.set(null);

    this.subscriptionsApi
      .submitCheckout(plan.code, this.billingCycleSignal(), outcome)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payment) => {
          this.processingSignal.set(false);
          if (this.iam.activeUser()?.id !== userId) return;
          if (payment.status === PaymentStatus.COMPLETED) this.selectedPlanSignal.set(null);
          if (
            payment.status === PaymentStatus.COMPLETED ||
            payment.status === PaymentStatus.REJECTED
          ) {
            this.paymentResultSignal.set(payment.status);
          }
          this.loadMySubscription(userId);
        },
        error: (error) => {
          this.processingSignal.set(false);
          if (this.iam.activeUser()?.id === userId)
            this.fail(error, 'subscriptions.errors.payment');
        },
      });
  };

  /** Stops renewal while retaining access through the end of the paid period. */
  cancelSubscription = (command: CancelSubscriptionCommand): void => {
    const subscription = this.subscriptionSignal();
    const userId = this.iam.activeUser()?.id;
    if (
      !subscription?.autoRenew ||
      subscription.id !== command.subscriptionId ||
      userId === undefined ||
      this.loadedUserId !== userId ||
      this.processingSignal()
    )
      return;

    this.processingSignal.set(true);
    this.errorSignal.set(null);
    this.subscriptionsApi
      .cancelMySubscription()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.processingSignal.set(false);
          if (this.iam.activeUser()?.id !== userId) return;
          ++this.subscriptionRequest;
          this.loadingSignal.set(false);
          this.subscriptionSignal.set(this.withPlan(saved, this.plansSignal()));
        },
        error: (error) => {
          this.processingSignal.set(false);
          if (this.iam.activeUser()?.id === userId) this.fail(error, 'subscriptions.errors.cancel');
        },
      });
  };

  downloadReceipt = (reference: string): void => {
    if (this.iam.activeUser()?.id !== this.loadedUserId) return;
    const payment = this.paymentsSignal().find((candidate) => candidate.reference === reference);
    if (!payment || payment.status !== PaymentStatus.COMPLETED) {
      this.errorSignal.set('subscriptions.errors.receipt');
      return;
    }
    this.fileDownloader.save(this.subscriptionsApi.buildReceipt(payment));
  };

  /** Clears the checkout (selected plan and result) when the user leaves it. */
  resetCheckout = (): void => {
    this.selectedPlanSignal.set(null);
    this.paymentResultSignal.set(null);
    this.errorSignal.set(null);
  };

  // Private helpers

  /** Completes the plan of a subscription from the catalog. */
  private withPlan(subscription: Subscription, plans: Plan[]): Subscription {
    subscription.plan = plans.find((plan) => plan.code === subscription.planCode) ?? null;
    return subscription;
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
