import { Money } from '../../../shared/domain/model/money';
import { ConfirmPaymentCommand } from '../../domain/model/commands/confirm-payment.command';
import { StartPaymentCheckoutCommand } from '../../domain/model/commands/start-payment-checkout.command';
import { PaymentCheckout } from '../../domain/model/entities/payment-checkout';
import { ConfirmPaymentRequest } from '../requests/confirm-payment.request';
import { StartPaymentCheckoutRequest } from '../requests/start-payment-checkout.request';
import { PaymentCheckoutResource } from '../responses/payment-checkout.response';

/** Maps the Mercado Pago checkout commands and responses. */
export class PaymentCheckoutAssembler {
  /**
   * Converts the checkout returned by the API into the domain object.
   * @param resource - Checkout resource.
   */
  toEntityFromResource = (resource: PaymentCheckoutResource): PaymentCheckout =>
    new PaymentCheckout({
      reference: resource.reference,
      amount: new Money(resource.amount, resource.currency),
      checkoutUrl: resource.checkoutUrl,
      sandboxCheckoutUrl: resource.sandboxCheckoutUrl,
    });

  /**
   * Converts the command that starts a checkout into its request.
   * @param command - Plan and billing cycle to pay.
   */
  toStartRequestFromCommand = (command: StartPaymentCheckoutCommand): StartPaymentCheckoutRequest => ({
    planCode: command.planCode,
    billingCycle: command.billingCycle,
  });

  /**
   * Converts the command that confirms a payment into its request.
   * @param command - Payment id given by Mercado Pago.
   */
  toConfirmRequestFromCommand = (command: ConfirmPaymentCommand): ConfirmPaymentRequest => ({
    paymentId: command.paymentId,
  });
}
