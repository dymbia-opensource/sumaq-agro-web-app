import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BillingCycle } from '../../domain/model/entities/billing-cycle';
import { PaymentStatus } from '../../domain/model/entities/payment-status';
import { PlanCode } from '../../domain/model/entities/plan-code';
import { PaymentAssembler } from '../assemblers/payment.assembler';
import { SubscriptionAssembler } from '../assemblers/subscription.assembler';
import { PaymentResource } from '../responses/payment.response';
import { SubscriptionResource } from '../responses/subscription.response';

export class SubscriptionsApiEndpoint {
  private readonly url =
    environment.platformProviderApiBaseUrl +
    environment.platformProviderSubscriptionsEndpointPath +
    '/me';
  private readonly assembler = new SubscriptionAssembler();
  private readonly paymentAssembler = new PaymentAssembler();

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
