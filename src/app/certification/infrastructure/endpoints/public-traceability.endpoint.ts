import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VerifyCertificateCommand } from '../../domain/model/commands/verify-certificate.command';
import { PublicTraceabilityRecord } from '../../domain/model/entities/public-traceability-record.entity';
import { PublicTraceabilityAssembler } from '../assemblers/public-traceability.assembler';
import { PublicTraceabilityResource } from '../responses/public-traceability.response';

/** HTTP endpoint for the public verification of certificates (`/public/traceability`). */
export class PublicTraceabilityApiEndpoint {
  private readonly url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderPublicTraceabilityEndpointPath}`;
  private readonly assembler = new PublicTraceabilityAssembler();

  constructor(private readonly http: HttpClient) {}

  verify(command: VerifyCertificateCommand): Observable<PublicTraceabilityRecord> {
    return this.http
      .get<PublicTraceabilityResource>(this.url, {
        params: { number: command.number, hash: command.hash },
      })
      .pipe(map(this.assembler.toEntityFromResource));
  }
}
