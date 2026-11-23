/**
 * Confirms a Mercado Pago payment with the `payment_id` that Mercado Pago adds
 * to the return address. The platform reads the payment and activates or
 * renews the subscription when it is approved.
 */
export class ConfirmPaymentCommand {
  readonly paymentId: string;

  constructor(props: { paymentId: string }) {
    const paymentId = props.paymentId.trim();
    if (!/^\d{1,30}$/.test(paymentId)) {
      throw new Error('subscriptions.errors.no-payment');
    }
    this.paymentId = paymentId;
  }
}
