import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { CertificateStatus } from './certificate-status';
import { QualityCategory } from './quality-category';

/**
 * Quality certificate of a graded batch. Its hash and number let anybody
 * verify it from the QR code of the PDF document.
 */
export class QualityCertificate extends BaseEntity {
  readonly certificateNumber: string;
  readonly harvestBatchId: number;
  readonly qualityCategory: QualityCategory;
  /** SHA-256 hash printed in the document and its QR code. */
  readonly certificateHash: string;
  readonly issuedByUserId: number;
  readonly issuedAt: Date;
  readonly status: CertificateStatus;

  constructor(props: {
    id: number;
    certificateNumber: string;
    harvestBatchId: number;
    qualityCategory: QualityCategory;
    certificateHash: string;
    issuedByUserId: number;
    issuedAt: Date;
    status: CertificateStatus;
  }) {
    super({ id: props.id });
    this.certificateNumber = props.certificateNumber;
    this.harvestBatchId = props.harvestBatchId;
    this.qualityCategory = props.qualityCategory;
    this.certificateHash = props.certificateHash;
    this.issuedByUserId = props.issuedByUserId;
    this.issuedAt = props.issuedAt;
    this.status = props.status;
  }

  /** Identifier of the certificate in the platform. */
  get certificateId(): number {
    return this.id as number;
  }

  /** `true` while the certificate has not been revoked. */
  get isActive(): boolean {
    return this.status === CertificateStatus.ACTIVE;
  }
}
