import { Money } from '../../../../shared/domain/model/money';

/**
 * Pending payment of a plan, opened in Mercado Pago Checkout Pro.
 *
 * @remarks
 * The producer pays on the page of Mercado Pago (`checkoutUrl`) and comes back
 * to `/subscriptions/payment-result`, where the payment is confirmed.
 */
export class PaymentCheckout {
  /** Reference of the payment in the platform. */
  readonly reference: string;
  /** Price of the plan. */
  readonly amount: Money;
  /** Page of Mercado Pago where the producer pays. */
  readonly checkoutUrl: string;
  /** Test page of Mercado Pago, when it gives one. */
  readonly sandboxCheckoutUrl: string | null;

  constructor(props: {
    reference: string;
    amount: Money;
    checkoutUrl: string;
    sandboxCheckoutUrl: string | null;
  }) {
    if (!props.checkoutUrl.startsWith('https://')) {
      throw new Error('subscriptions.errors.checkout-session');
    }
    this.reference = props.reference;
    this.amount = props.amount;
    this.checkoutUrl = props.checkoutUrl;
    this.sandboxCheckoutUrl = props.sandboxCheckoutUrl;
  }
}
