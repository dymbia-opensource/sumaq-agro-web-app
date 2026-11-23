/** Payload sent to confirm a Mercado Pago payment (`POST /subscriptions/me/payment-confirmations`). */
export interface ConfirmPaymentRequest {
  /** `payment_id` that Mercado Pago adds to the return address (digits only). */
  paymentId: string;
}
