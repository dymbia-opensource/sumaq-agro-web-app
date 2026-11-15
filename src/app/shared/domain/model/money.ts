/**
 * Value object that represents an amount of money in a given currency.
 *
 * @remarks
 * It is immutable: every operation returns a new instance. The cost ledger
 * uses it for expenses, total investment and breakeven price.
 */
export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  /**
   * Creates an amount of money.
   * @param amount - Amount, it cannot be negative.
   * @param currency - ISO 4217 currency code (for example, `PEN`).
   */
  constructor(amount: number, currency: string = 'PEN') {
    if (amount < 0) {
      throw new Error('The amount cannot be negative.');
    }
    this._amount = amount;
    this._currency = currency;
  }

  /** Amount of money. */
  get amount(): number {
    return this._amount;
  }

  /** ISO 4217 currency code. */
  get currency(): string {
    return this._currency;
  }

  /**
   * Adds another amount in the same currency.
   * @param other - Amount to add.
   * @returns A new {@link Money} with the sum.
   */
  add(other: Money): Money {
    if (other.currency !== this._currency) {
      throw new Error('Cannot add amounts in different currencies.');
    }
    return new Money(this._amount + other.amount, this._currency);
  }

  /**
   * Multiplies the amount by a factor (for example, quantity × unit price).
   * @param factor - Multiplier, it cannot be negative.
   * @returns A new {@link Money} with the product.
   */
  multiply(factor: number): Money {
    return new Money(this._amount * factor, this._currency);
  }

  /**
   * Formats the amount for display (for example, `S/ 14,850.00`).
   * @param locale - Locale used to format the number.
   */
  format(locale: string = 'es-PE'): string {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: this._currency }).format(
      this._amount,
    );
  }
}
