import { HttpClient } from '@angular/common/http';
import { map, Observable, of, switchMap } from 'rxjs';
import { PublicTraceabilityRecord } from '../../domain/model/entities/public-traceability-record.entity';
import { PublicTraceabilityAssembler } from '../assemblers/public-traceability.assembler';
import { HarvestBatchesApiEndpoint } from './harvest-batches.endpoint';
import { QualityCertificatesApiEndpoint } from './quality-certificates.endpoint';

/** Une certificado y lote de la API de prueba para la consulta pública. */
export class PublicTraceabilityApiEndpoint {
  private readonly batches: HarvestBatchesApiEndpoint;
  private readonly certificates: QualityCertificatesApiEndpoint;
  private readonly assembler = new PublicTraceabilityAssembler();

  constructor(http: HttpClient) {
    this.batches = new HarvestBatchesApiEndpoint(http);
    this.certificates = new QualityCertificatesApiEndpoint(http);
  }

  /** El token localiza el certificado y su harvestBatchId localiza el lote. */
  getByToken(token: string): Observable<PublicTraceabilityRecord | null> {
    return this.certificates.getByToken(token).pipe(
      switchMap((certificate) => {
        if (!certificate) return of(null);
        return this.batches.getById(certificate.data.harvestBatchId).pipe(
          map((batch) =>
            this.assembler.toEntityFromResource({
              id: certificate.id as number,
              certificate: { ...certificate.data },
              batch: { ...batch.data },
            }),
          ),
        );
      }),
    );
  }
}
