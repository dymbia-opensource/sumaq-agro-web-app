import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { ExportedFile } from '../../shared/infrastructure/file-downloader';
import { Payment } from '../domain/model/entities/payment.entity';
import { Plan } from '../domain/model/entities/plan.entity';
import { Subscription } from '../domain/model/entities/subscription.entity';
import { DEMO_COUPONS } from './demo-coupons';
import { PaymentsApiEndpoint } from './endpoints/payments.endpoint';
import { PlansApiEndpoint } from './endpoints/plans.endpoint';
import { SubscriptionsApiEndpoint } from './endpoints/subscriptions.endpoint';
import { DemoCheckout, type DemoCheckoutRequest } from './mock/demo-checkout';
import { buildReceiptPdf } from './receipt-pdf';


@Injectable({ providedIn: 'root' })
export class SubscriptionsApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly plansEndpoint = new PlansApiEndpoint(this.http);
  private readonly subscriptionsEndpoint = new SubscriptionsApiEndpoint(this.http);
  private readonly paymentsEndpoint = new PaymentsApiEndpoint(this.http);
  private readonly demoCheckout = new DemoCheckout(this.subscriptionsEndpoint, this.paymentsEndpoint);

  /** Retrieves the plans of the catalog. */
  getPlans = (): Observable<Plan[]> => this.plansEndpoint.getAll();

  /**
   * Retrieves the subscription of one user.
   * @param userId - Owner of the subscription.
   * @returns The subscription, or `null` if the user has none yet.
   */
  getSubscriptionByUserId = (userId: number): Observable<Subscription | null> =>
    this.subscriptionsEndpoint.getByUser(userId);

  /** Runs the university checkout when demo payments are enabled. */
  submitCheckout = (request: DemoCheckoutRequest) =>
    environment.useMockSubscriptionPayments
      ? this.demoCheckout.submit(request)
      : throwError(() => new Error('subscriptions.checkout.unavailable'));

  /** Saves the changes of a subscription (new plan, cancellation). */
  updateSubscription = (subscription: Subscription): Observable<Subscription> =>
    this.subscriptionsEndpoint.update(subscription, subscription.id);

  /** Retrieves the payments of one subscription. */
  getPayments = (subscriptionId: number): Observable<Payment[]> =>
    this.paymentsEndpoint.getBySubscription(subscriptionId);

  /**
   * Checks a promotional code.
   * @param couponCode - Code typed by the user.
   * @returns Percentage discounted, or `null` if the code is not valid.
   * @remarks Temporary: the RESTful API will validate the coupon.
   */
  getCouponDiscount = (couponCode: string): Observable<number | null> =>
    of(DEMO_COUPONS[couponCode.trim().toUpperCase()] ?? null);

  /**
   * Builds the receipt of a payment.
   * @remarks Temporary: the RESTful API will return the real receipt.
   */
  buildReceipt = (payment: Payment, planName: string): ExportedFile => ({
    fileName: `receipt-${payment.transactionToken}.pdf`,
    content: buildReceiptPdf([
      'SumaqAgro - Payment receipt',
      `Transaction: ${payment.transactionToken}`,
      `Plan: ${planName}`,
      `Date: ${payment.paidAt.toISOString().slice(0, 10)}`,
      `Amount: ${payment.amount.currency} ${payment.amount.amount.toFixed(2)}`,
      `Status: ${payment.status}`,
    ]),
  });
}
