import { BaseResponse } from '../../../shared/infrastructure/base-response';
import { HarvestBatchResource } from './harvest-batch.response';

/** Respuesta de colección cuando el backend envuelve los lotes en `batches`. */
export interface HarvestBatchesResponse extends BaseResponse {
  batches: HarvestBatchResource[];
}
