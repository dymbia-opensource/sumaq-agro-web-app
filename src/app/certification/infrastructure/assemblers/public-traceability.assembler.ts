import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { HarvestBatch } from '../../domain/model/entities/harvest-batch.entity';
import { PublicTraceabilityRecord } from '../../domain/model/entities/public-traceability-record.entity';
import { QualityCertificate } from '../../domain/model/entities/quality-certificate.entity';
import {
  PublicTraceabilityResource,
  PublicTraceabilityResponse,
} from '../responses/public-traceability.response';

/** Reconstruye el modelo público a partir del certificado y el lote recibidos. */
export class PublicTraceabilityAssembler implements BaseAssembler<
  PublicTraceabilityRecord,
  PublicTraceabilityResource,
  PublicTraceabilityResponse
> {
  toEntityFromResource(resource: PublicTraceabilityResource): PublicTraceabilityRecord {
    return new PublicTraceabilityRecord(
      new QualityCertificate(resource.certificate),
      new HarvestBatch(resource.batch),
    );
  }

  toResourceFromEntity(entity: PublicTraceabilityRecord): PublicTraceabilityResource {
    return {
      id: entity.id as number,
      certificate: { ...entity.certificate.data },
      batch: { ...entity.batch.data },
    };
  }

  toEntitiesFromResponse(response: PublicTraceabilityResponse): PublicTraceabilityRecord[] {
    return response.records.map((resource) => this.toEntityFromResource(resource));
  }
}
