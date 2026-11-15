import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { HarvestBatch } from '../../domain/model/entities/harvest-batch.entity';
import { HarvestBatchResource } from '../responses/harvest-batch.response';
import { HarvestBatchesResponse } from '../responses/harvest-batches.response';

/** Convierte los datos recibidos de la API en entidades HarvestBatch. */
export class HarvestBatchAssembler implements BaseAssembler<
  HarvestBatch,
  HarvestBatchResource,
  HarvestBatchesResponse
> {
  toEntityFromResource(resource: HarvestBatchResource): HarvestBatch {
    return new HarvestBatch(resource);
  }

  toResourceFromEntity(entity: HarvestBatch): HarvestBatchResource {
    return { ...entity.data };
  }

  toEntitiesFromResponse(response: HarvestBatchesResponse): HarvestBatch[] {
    return response.batches.map((resource) => this.toEntityFromResource(resource));
  }
}
