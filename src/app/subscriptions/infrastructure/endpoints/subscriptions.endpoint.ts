import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BillingCycle } from '../../domain/model/entities/billing-cycle';
import { PaymentStatus } from '../../domain/model/entities/payment-status';
import { PlanCode } from '../../domain/model/entities/plan-code';
import { ConfirmPaymentCommand } from '../../domain/model/commands/confirm-payment.command';
import { StartPaymentCheckoutCommand } from '../../domain/model/commands/start-payment-checkout.command';
import { PaymentAssembler } from '../assemblers/payment.assembler';
import { PaymentCheckoutAssembler } from '../assemblers/payment-checkout.assembler';
import { SubscriptionAssembler } from '../assemblers/subscription.assembler';
import { PaymentResource } from '../responses/payment.response';
import { PaymentCheckoutResource } from '../responses/payment-checkout.response';
import { SubscriptionResource } from '../responses/subscription.response';

export class SubscriptionsApiEndpoint {
  private readonly url =
    environment.platformProviderApiBaseUrl +
    environment.platformProviderSubscriptionsEndpointPath +
    '/me';
  private readonly assembler = new SubscriptionAssembler();
  private readonly paymentAssembler = new PaymentAssembler();
  private readonly checkoutAssembler = new PaymentCheckoutAssembler();

  constructor(private readonly http: HttpClient) {}

  getMine() {
    return this.http
      .get<SubscriptionResource | null>(this.url)
      .pipe(
        map((resource) =>
          resource === null ? null : this.assembler.toEntityFromResource(resource),
        ),
      );
  }

  cancel() {
    return this.http
      .post<SubscriptionResource>(this.url + '/cancellation', null)
      .pipe(map(this.assembler.toEntityFromResource));
  }

  /**
   * Starts paying a plan with Mercado Pago Checkout Pro.
   * @param command - Plan and billing cycle.
   * @returns The checkout, with the Mercado Pago page to open.
   */
  startCheckoutSession(command: StartPaymentCheckoutCommand) {
    return this.http
      .post<PaymentCheckoutResource>(
        this.url + '/checkout-sessions',
        this.checkoutAssembler.toStartRequestFromCommand(command),
      )
      .pipe(map(this.checkoutAssembler.toEntityFromResource));
  }

  /**
   * Confirms the payment that Mercado Pago reports on its return address.
   * @param command - Payment id given by Mercado Pago.
   * @returns The payment with its outcome (COMPLETED, REJECTED or PENDING).
   */
  confirmPayment(command: ConfirmPaymentCommand) {
    return this.http
      .post<PaymentResource>(
        this.url + '/payment-confirmations',
        this.checkoutAssembler.toConfirmRequestFromCommand(command),
      )
      .pipe(map(this.paymentAssembler.toEntityFromResource));
  }

  /**
   * Simulated payment of the `dev` profile of the platform (`POST /subscriptions/me/checkout`).
   */
  checkout(
    planCode: PlanCode,
    billingCycle: BillingCycle,
    simulatedOutcome: PaymentStatus.COMPLETED | PaymentStatus.REJECTED,
  ) {
    return this.http
      .post<PaymentResource>(this.url + '/checkout', {
        planCode,
        billingCycle,
        simulatedOutcome,
      })
      .pipe(map(this.paymentAssembler.toEntityFromResource));
  }
}
