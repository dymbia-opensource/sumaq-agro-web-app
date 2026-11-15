import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaymentAssembler } from '../assemblers/payment.assembler';
import { PaymentResource } from '../responses/payment.response';

export class PaymentsApiEndpoint {
  private readonly url =
    environment.platformProviderApiBaseUrl +
    environment.platformProviderSubscriptionsEndpointPath +
    '/me/payments';
  private readonly assembler = new PaymentAssembler();

  constructor(private readonly http: HttpClient) {}

  getAll() {
    return this.http
      .get<PaymentResource[]>(this.url)
      .pipe(map((resources) => resources.map(this.assembler.toEntityFromResource)));
  }
}
