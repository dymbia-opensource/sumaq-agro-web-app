import { BillingCycle } from '../entities/billing-cycle';
import { PlanCode } from '../entities/plan-code';

/** Starts paying a plan with Mercado Pago Checkout Pro. */
export class StartPaymentCheckoutCommand {
  readonly planCode: PlanCode;
  readonly billingCycle: BillingCycle;

  constructor(props: { planCode: PlanCode; billingCycle: BillingCycle }) {
    this.planCode = props.planCode;
    this.billingCycle = props.billingCycle;
  }
}
