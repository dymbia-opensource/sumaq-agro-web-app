import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { BillingCycle } from './billing-cycle';
import { Plan } from './plan.entity';
import { PlanCode } from './plan-code';
import { SubscriptionStatus } from './subscription-status';

function calendarDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** A subscription and its paid access period. */
export class Subscription extends BaseEntity {
  readonly planCode: PlanCode;
  readonly status: SubscriptionStatus;
  readonly billingCycle: BillingCycle;
  readonly startDate: Date;
  readonly endDate: Date;
  plan: Plan | null = null;

  constructor(props: {
    id: number;
    planCode: PlanCode;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    startDate: Date;
    endDate: Date;
  }) {
    super({ id: props.id });
    this.planCode = props.planCode;
    this.status = props.status;
    this.billingCycle = props.billingCycle;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
  }

  get autoRenew(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  /** Cancellation preserves access through the last paid day. */
  hasAccess(today: Date = new Date()): boolean {
    const day = calendarDay(today);
    return calendarDay(this.startDate) <= day && day <= calendarDay(this.endDate);
  }

  isExpired(today: Date = new Date()): boolean {
    return calendarDay(this.endDate) < calendarDay(today);
  }
}
