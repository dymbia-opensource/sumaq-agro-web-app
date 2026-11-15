import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { Money } from '../../../../shared/domain/model/money';
import { ExpenseCategory, ExpenseEntry } from './expense-entry.entity';

export enum YieldUnit {
  SACK = 'SACK', // potato
  QUINTAL = 'QUINTAL', // coffee (46 kg)
}

/** Cost ledger of a campaign: expenses and expected/actual yield. */
export class CampaignLedger extends BaseEntity {
  private _campaignId: number;
  private _entries: ExpenseEntry[];
  private _expectedYield: number;
  private _actualYield: number | null;
  private _yieldUnit: YieldUnit;
  private _frozen: boolean;
  private _currency: string;

  constructor(props: {
    id: number;
    campaignId: number;
    entries?: ExpenseEntry[];
    expectedYield?: number;
    actualYield?: number | null;
    yieldUnit?: YieldUnit;
    frozen?: boolean;
    currency?: string;
  }) {
    super({ id: props.id });
    this._campaignId = props.campaignId;
    this._entries = props.entries ?? [];
    this._expectedYield = props.expectedYield ?? 0;
    this._actualYield = props.actualYield ?? null;
    this._yieldUnit = props.yieldUnit ?? YieldUnit.SACK;
    this._frozen = props.frozen ?? false;
    this._currency = props.currency ?? 'PEN';
  }

  get campaignId(): number {
    return this._campaignId;
  }

  set campaignId(value: number) {
    this._campaignId = value;
  }

  get entries(): ExpenseEntry[] {
    return this._entries;
  }

  set entries(value: ExpenseEntry[]) {
    this._entries = value;
  }

  get expectedYield(): number {
    return this._expectedYield;
  }

  set expectedYield(value: number) {
    this._expectedYield = value;
  }

  get actualYield(): number | null {
    return this._actualYield;
  }

  set actualYield(value: number | null) {
    this._actualYield = value;
  }

  get yieldUnit(): YieldUnit {
    return this._yieldUnit;
  }

  set yieldUnit(value: YieldUnit) {
    this._yieldUnit = value;
  }

  /** A frozen ledger does not accept more expenses. */
  get frozen(): boolean {
    return this._frozen;
  }

  set frozen(value: boolean) {
    this._frozen = value;
  }

  get currency(): string {
    return this._currency;
  }

  set currency(value: string) {
    this._currency = value;
  }

  /** Most recent first. If a category is given, only that one. */
  expenseHistory(category?: ExpenseCategory | null): ExpenseEntry[] {
    return [...this._entries]
      .sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime())
      .filter((entry) => !category || entry.category === category);
  }

  totalInvestment(): Money {
    return this.sumOf(this._entries);
  }

  totalByCategory(category: ExpenseCategory): Money {
    return this.sumOf(this._entries.filter((entry) => entry.category === category));
  }

  /** Percentage (0-100) of the total investment. */
  percentageByCategory(category: ExpenseCategory): number {
    const total = this.totalInvestment().amount;
    return total === 0 ? 0 : (this.totalByCategory(category).amount / total) * 100;
  }

  /** Actual yield if there is one, otherwise the expected one. */
  referenceYield(): number {
    return this._actualYield ?? this._expectedYield;
  }

  /** Total investment / yield. */
  breakevenPrice(): Money {
    return this.breakevenPriceFor(this.referenceYield());
  }

  /** Same as breakevenPrice, but with the yield we pass. */
  breakevenPriceFor(yieldQuantity: number): Money {
    return yieldQuantity > 0
      ? this.totalInvestment().multiply(1 / yieldQuantity)
      : new Money(0, this._currency);
  }

  /** Breakeven price + margin (%), rounded up. */
  suggestedPrice(marginPercentage = 0): Money {
    return new Money(
      Math.ceil(this.breakevenPrice().amount * (1 + marginPercentage / 100)),
      this._currency,
    );
  }

  /** Without a category it uses the total investment. */
  costPerHectare(areaHectares: number, category?: ExpenseCategory): Money {
    if (areaHectares <= 0) return new Money(0, this._currency);
    const total = category ? this.totalByCategory(category) : this.totalInvestment();
    return total.multiply(1 / areaHectares);
  }

  yieldPerHectare(areaHectares: number): number {
    return areaHectares <= 0 ? 0 : this.referenceYield() / areaHectares;
  }

  private sumOf(entries: ExpenseEntry[]): Money {
    return entries.reduce((sum, entry) => sum.add(entry.total()), new Money(0, this._currency));
  }
}
