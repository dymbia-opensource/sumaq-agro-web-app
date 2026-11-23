/** Mercado Pago checkout of a pending payment, returned by `POST /subscriptions/me/checkout-sessions`. */
export interface PaymentCheckoutResource {
  /** Reference of the payment in the platform. */
  reference: string;
  /** Price of the plan. */
  amount: number;
  /** Currency, for example `PEN`. */
  currency: string;
  /** Page of Mercado Pago where the producer pays. */
  checkoutUrl: string;
  /** Test page of Mercado Pago, when it gives one. */
  sandboxCheckoutUrl: string | null;
}
