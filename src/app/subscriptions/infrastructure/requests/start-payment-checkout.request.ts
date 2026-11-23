import { BillingCycle } from '../../domain/model/entities/billing-cycle';
import { PlanCode } from '../../domain/model/entities/plan-code';

/** Payload sent to pay a plan with Mercado Pago (`POST /subscriptions/me/checkout-sessions`). */
export interface StartPaymentCheckoutRequest {
  /** Plan to pay; it must match the role of the producer. */
  planCode: PlanCode;
  /** Monthly or annual. */
  billingCycle: BillingCycle;
}
