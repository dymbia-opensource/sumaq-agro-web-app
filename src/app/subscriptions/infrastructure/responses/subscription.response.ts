import { BillingCycle } from '../../domain/model/entities/billing-cycle';
import { PlanCode } from '../../domain/model/entities/plan-code';
import { SubscriptionStatus } from '../../domain/model/entities/subscription-status';

export interface SubscriptionResource {
  id: number;
  planCode: PlanCode;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
}
