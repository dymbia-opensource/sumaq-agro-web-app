import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { BillingCycle } from './billing-cycle';
import { Plan } from './plan.entity';
import { SubscriptionStatus } from './subscription-status';

/** Midnight of the given day, so dates are compared by calendar day. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds one billing cycle to a date, keeping the day inside the target month. */
function addCycle(start: Date, cycle: BillingCycle): Date {
  const months = cycle === BillingCycle.ANNUAL ? 12 : 1;
  const lastDay = new Date(start.getFullYear(), start.getMonth() + months + 1, 0).getDate();
  return new Date(
    start.getFullYear(),
    start.getMonth() + months,
    Math.min(start.getDate(), lastDay),
  );
}

/**
 * Plan of one user, with its state, billing cycle and validity.
 *
 * @remarks
 * It only stores the `planId`; the store fills `plan` after loading the catalog.
 */
export class Subscription extends BaseEntity {
  private _userId: number;
  private _planId: number;
  private _plan: Plan | null;
  private _status: SubscriptionStatus;
  private _billingCycle: BillingCycle;
  private _startDate: Date;
  private _endDate: Date | null;
  private _autoRenew: boolean;

  constructor(props: {
    id: number;
    userId: number;
    planId: number;
    plan?: Plan | null;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    startDate: Date;
    endDate?: Date | null;
    autoRenew: boolean;
  }) {
    super({ id: props.id });
    this._userId = props.userId;
    this._planId = props.planId;
    this._plan = props.plan ?? null;
    this._status = props.status;
    this._billingCycle = props.billingCycle;
    this._startDate = props.startDate;
    this._endDate = props.endDate ?? null;
    this._autoRenew = props.autoRenew;
  }

  /** New subscription after the first approved payment. The server assigns the id. */
  static start(props: {
    userId: number;
    plan: Plan;
    billingCycle: BillingCycle;
    startDate: Date;
  }): Subscription {
    const subscription = new Subscription({
      id: 0,
      userId: props.userId,
      planId: props.plan.id as number,
      plan: props.plan,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: props.billingCycle,
      startDate: startOfDay(props.startDate),
      endDate: null,
      autoRenew: true,
    });
    subscription.changePlan(props.plan, props.billingCycle, props.startDate);
    return subscription;
  }

  get userId(): number {
    return this._userId;
  }

  get planId(): number {
    return this._planId;
  }

  /** Plan of the subscription, or `null` until the store completes it. */
  get plan(): Plan | null {
    return this._plan;
  }

  set plan(value: Plan | null) {
    this._plan = value;
    if (value) this._planId = value.id as number;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get billingCycle(): BillingCycle {
    return this._billingCycle;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date | null {
    return this._endDate;
  }

  get autoRenew(): boolean {
    return this._autoRenew;
  }

  /** `true` while the subscription is not cancelled. */
  isActive(): boolean {
    return this._status === SubscriptionStatus.ACTIVE;
  }

  /** Returns whether the subscription grants access on the given calendar day. */
  hasAccess(today: Date = new Date()): boolean {
    const day = startOfDay(today);
    const grantsAccess =
      this._status === SubscriptionStatus.ACTIVE || this._status === SubscriptionStatus.CANCELLED;

    return (
      grantsAccess &&
      this._endDate !== null &&
      startOfDay(this._startDate) <= day &&
      day <= startOfDay(this._endDate)
    );
  }

  /** Returns whether the last paid calendar day has passed. */
  isExpired(today: Date = new Date()): boolean {
    return this._endDate !== null && startOfDay(this._endDate) < startOfDay(today);
  }

  /** Plots still available under the quota of the plan. */
  remainingPlotSlots(registeredPlots: number): number {
    return Math.max(0, (this._plan?.plotQuota ?? 0) - registeredPlots);
  }

  /** `true` when one more plot fits in the quota. */
  canRegisterPlot(registeredPlots: number): boolean {
    return this._plan !== null && registeredPlots < this._plan.plotQuota;
  }

  /** Moves to another plan and starts a new period (policy P2 after a paid charge). */
  changePlan(plan: Plan, cycle: BillingCycle, startDate: Date): void {
    this._plan = plan;
    this._planId = plan.id as number;
    this._status = SubscriptionStatus.ACTIVE;
    this._billingCycle = cycle;
    this._startDate = startOfDay(startDate);
    this._endDate = addCycle(this._startDate, cycle);
    this._autoRenew = true;
  }

  /** Stops the renewal; the user keeps the access until the end date. */
  cancel(): void {
    if (this._status === SubscriptionStatus.CANCELLED) {
      throw new Error('The subscription is already cancelled.');
    }
    this._status = SubscriptionStatus.CANCELLED;
    this._autoRenew = false;
    this._endDate ??= addCycle(this._startDate, this._billingCycle);
  }

  /** Independent copy, so a change is applied before it is confirmed by the API. */
  copy(): Subscription {
    return new Subscription({
      id: this.id as number,
      userId: this._userId,
      planId: this._planId,
      plan: this._plan,
      status: this._status,
      billingCycle: this._billingCycle,
      startDate: this._startDate,
      endDate: this._endDate,
      autoRenew: this._autoRenew,
    });
  }
}
