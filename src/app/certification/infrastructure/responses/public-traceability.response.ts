import { BaseResponse, BaseResource } from '../../../shared/infrastructure/base-response';
import { HarvestBatchResource } from './harvest-batch.response';
import { QualityCertificateResource } from './quality-certificate.response';

/** Datos unidos que necesita la vista pública de trazabilidad. */
export interface PublicTraceabilityResource extends BaseResource {
  id: number;
  certificate: QualityCertificateResource;
  batch: HarvestBatchResource;
}

/** Formato de colección para registros de trazabilidad pública. */
export interface PublicTraceabilityResponse extends BaseResponse {
  records: PublicTraceabilityResource[];
}
