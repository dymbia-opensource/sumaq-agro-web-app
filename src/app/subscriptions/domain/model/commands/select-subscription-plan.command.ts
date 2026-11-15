import { BillingCycle } from '../entities/billing-cycle';
import { PlanCode } from '../entities/plan-code';

/** Chooses a plan and a billing cycle to go to the payment */
export class SelectSubscriptionPlanCommand {
  readonly userId: number;
  readonly planCode: PlanCode;
  readonly billingCycle: BillingCycle;

  constructor(props: { userId: number; planCode: PlanCode; billingCycle: BillingCycle }) {
    this.userId = props.userId;
    this.planCode = props.planCode;
    this.billingCycle = props.billingCycle;
  }
}
