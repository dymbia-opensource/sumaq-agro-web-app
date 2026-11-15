import { Money } from '../../../../shared/domain/model/money';
import { BillingCycle } from './billing-cycle';
import { PlanCode } from './plan-code';

/** Plan of the catalog with its prices and plot quota. */
export class Plan {
  private _code: PlanCode;
  private _monthlyPrice: Money;
  private _annualPrice: Money;
  private _plotQuota: number;
  private _features: string[];

  constructor(props: {
    code: PlanCode;
    monthlyPrice: Money;
    annualPrice: Money;
    plotQuota: number;
    features?: string[];
  }) {
    this._code = props.code;
    this._monthlyPrice = props.monthlyPrice;
    this._annualPrice = props.annualPrice;
    this._plotQuota = props.plotQuota;
    this._features = props.features ?? [];
  }

  get code(): PlanCode {
    return this._code;
  }

  get monthlyPrice(): Money {
    return this._monthlyPrice;
  }

  get annualPrice(): Money {
    return this._annualPrice;
  }

  /** Plots the producer can register with this plan. */
  get plotQuota(): number {
    return this._plotQuota;
  }

  get features(): string[] {
    return [...this._features];
  }

  /** Price charged for one billing cycle. */
  priceFor(cycle: BillingCycle): Money {
    return cycle === BillingCycle.ANNUAL ? this._annualPrice : this._monthlyPrice;
  }

  /** Money saved by paying the year at once instead of twelve months. */
  annualSavings(): Money {
    const savings = this._monthlyPrice.amount * 12 - this._annualPrice.amount;
    return new Money(Math.max(0, savings), this._monthlyPrice.currency);
  }
}
