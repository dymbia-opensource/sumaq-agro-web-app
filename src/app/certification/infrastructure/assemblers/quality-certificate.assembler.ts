import { IssueQualityCertificateCommand } from '../../domain/model/commands/issue-quality-certificate.command';
import { CertificateStatus } from '../../domain/model/entities/certificate-status';
import { QualityCategory } from '../../domain/model/entities/quality-category';
import { QualityCertificate } from '../../domain/model/entities/quality-certificate.entity';
import { IssueQualityCertificateRequest } from '../requests/issue-quality-certificate.request';
import { QualityCertificateResource } from '../responses/quality-certificate.response';

/** Maps quality certificates to and from the API. */
export class QualityCertificateAssembler {
  /**
   * Converts a certificate resource into the domain entity.
   * @param resource - Certificate returned by the API.
   */
  toEntityFromResource = (resource: QualityCertificateResource): QualityCertificate =>
    new QualityCertificate({
      id: resource.id,
      certificateNumber: resource.certificateNumber,
      harvestBatchId: resource.harvestBatchId,
      qualityCategory: resource.qualityCategory as QualityCategory,
      certificateHash: resource.certificateHash,
      issuedByUserId: resource.issuedByUserId,
      issuedAt: new Date(resource.issuedAt),
      status: resource.status as CertificateStatus,
    });

  /**
   * Converts the issue command into its request.
   * @param command - Certificate to issue.
   */
  toIssueRequestFromCommand = (
    command: IssueQualityCertificateCommand,
  ): IssueQualityCertificateRequest => ({
    certificateNumber: command.certificateNumber,
    harvestBatchId: command.harvestBatchId,
    issuedByUserId: command.issuedByUserId,
  });
}
