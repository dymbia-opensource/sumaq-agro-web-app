import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { QualityCertificate } from '../../domain/model/entities/quality-certificate.entity';
import { QualityCertificateResource } from '../responses/quality-certificate.response';
import { QualityCertificatesResponse } from '../responses/quality-certificates.response';

/** Convierte los certificados entre el formato de API y la entidad de dominio. */
export class QualityCertificateAssembler implements BaseAssembler<
  QualityCertificate,
  QualityCertificateResource,
  QualityCertificatesResponse
> {
  toEntityFromResource(resource: QualityCertificateResource): QualityCertificate {
    return new QualityCertificate(resource);
  }

  toResourceFromEntity(entity: QualityCertificate): QualityCertificateResource {
    return { ...entity.data };
  }

  toEntitiesFromResponse(response: QualityCertificatesResponse): QualityCertificate[] {
    return response.certificates.map((resource) => this.toEntityFromResource(resource));
  }
}
