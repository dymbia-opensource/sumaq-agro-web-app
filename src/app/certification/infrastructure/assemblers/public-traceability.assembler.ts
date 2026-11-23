import { CertificateStatus } from '../../domain/model/entities/certificate-status';
import { HarvestCropType } from '../../domain/model/entities/crop-type';
import { PublicTraceabilityRecord } from '../../domain/model/entities/public-traceability-record.entity';
import { QualityCategory } from '../../domain/model/entities/quality-category';
import { PublicTraceabilityResource } from '../responses/public-traceability.response';

/** Maps the public verification of a certificate. */
export class PublicTraceabilityAssembler {
  /**
   * Converts the verification returned by the API into the domain record.
   * @param resource - Public verification.
   */
  toEntityFromResource = (resource: PublicTraceabilityResource): PublicTraceabilityRecord =>
    new PublicTraceabilityRecord({
      certificateNumber: resource.certificateNumber,
      status: resource.status as CertificateStatus,
      authentic: resource.authentic,
      batchCode: resource.batchCode,
      cropType: resource.cropType as HarvestCropType | null,
      qualityCategory: resource.qualityCategory as QualityCategory | null,
      qualityScore: resource.qualityScore,
      plotName: resource.plotName,
      region: resource.region,
      seedVariety: resource.seedVariety,
    });
}
