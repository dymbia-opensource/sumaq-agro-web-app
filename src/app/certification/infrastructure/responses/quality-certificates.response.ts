import { BaseResponse } from '../../../shared/infrastructure/base-response';
import { QualityCertificateResource } from './quality-certificate.response';

/** Respuesta de colección cuando el backend envuelve los certificados. */
export interface QualityCertificatesResponse extends BaseResponse {
  certificates: QualityCertificateResource[];
}
