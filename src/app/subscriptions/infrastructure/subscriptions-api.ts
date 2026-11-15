import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { ExportedFile } from '../../shared/infrastructure/file-downloader';
import { buildTextPdf } from '../../shared/infrastructure/text-pdf';
import { BillingCycle } from '../domain/model/entities/billing-cycle';
import { Payment } from '../domain/model/entities/payment.entity';
import { PaymentStatus } from '../domain/model/entities/payment-status';
import { PlanCode } from '../domain/model/entities/plan-code';
import { PaymentsApiEndpoint } from './endpoints/payments.endpoint';
import { PlansApiEndpoint } from './endpoints/plans.endpoint';
import { SubscriptionsApiEndpoint } from './endpoints/subscriptions.endpoint';

@Injectable({ providedIn: 'root' })
export class SubscriptionsApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly plansEndpoint = new PlansApiEndpoint(this.http);
  private readonly subscriptionsEndpoint = new SubscriptionsApiEndpoint(this.http);
  private readonly paymentsEndpoint = new PaymentsApiEndpoint(this.http);

  getPlans = () => this.plansEndpoint.getAll();
  getMySubscription = () => this.subscriptionsEndpoint.getMine();
  getMyPayments = () => this.paymentsEndpoint.getAll();
  cancelMySubscription = () => this.subscriptionsEndpoint.cancel();

  submitCheckout = (
    planCode: PlanCode,
    billingCycle: BillingCycle,
    outcome: PaymentStatus.COMPLETED | PaymentStatus.REJECTED,
  ) => this.subscriptionsEndpoint.checkout(planCode, billingCycle, outcome);

  buildReceipt = (payment: Payment): ExportedFile => ({
    fileName: `receipt-${payment.reference}.pdf`,
    content: buildTextPdf([
      'SumaqAgro - Demo payment receipt',
      `Transaction: ${payment.reference}`,
      `Plan: ${payment.planCode}`,
      `Date: ${payment.attemptedAt.toISOString().slice(0, 10)}`,
      `Amount: ${payment.amount.currency} ${payment.amount.amount.toFixed(2)}`,
      `Status: ${payment.status}`,
    ]),
  });
}
