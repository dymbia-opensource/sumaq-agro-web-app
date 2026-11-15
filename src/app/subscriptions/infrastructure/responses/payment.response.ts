import { BillingCycle } from '../../domain/model/entities/billing-cycle';
import { PaymentStatus } from '../../domain/model/entities/payment-status';
import { PlanCode } from '../../domain/model/entities/plan-code';

export interface PaymentResource {
  reference: string;
  subscriptionId: number | null;
  planCode: PlanCode;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  status: PaymentStatus;
  attemptedAt: string;
}
