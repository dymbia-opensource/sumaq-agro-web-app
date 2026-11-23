import { CertificateStatus } from './certificate-status';
import { HarvestCropType } from './crop-type';
import { QualityCategory } from './quality-category';

/**
 * What a buyer sees after scanning the QR code of a certificate: whether it
 * is authentic and where the batch comes from. It is public, so it carries no
 * identifiers of users.
 */
export class PublicTraceabilityRecord {
  readonly certificateNumber: string;
  readonly status: CertificateStatus;
  /** `false` when the hash of the link does not match the certificate. */
  readonly authentic: boolean;
  readonly batchCode: string | null;
  readonly cropType: HarvestCropType | null;
  readonly qualityCategory: QualityCategory | null;
  readonly qualityScore: number | null;
  readonly plotName: string | null;
  readonly region: string | null;
  readonly seedVariety: string | null;

  constructor(props: {
    certificateNumber: string;
    status: CertificateStatus;
    authentic: boolean;
    batchCode: string | null;
    cropType: HarvestCropType | null;
    qualityCategory: QualityCategory | null;
    qualityScore: number | null;
    plotName: string | null;
    region: string | null;
    seedVariety: string | null;
  }) {
    this.certificateNumber = props.certificateNumber;
    this.status = props.status;
    this.authentic = props.authentic;
    this.batchCode = props.batchCode;
    this.cropType = props.cropType;
    this.qualityCategory = props.qualityCategory;
    this.qualityScore = props.qualityScore;
    this.plotName = props.plotName;
    this.region = props.region;
    this.seedVariety = props.seedVariety;
  }

  /** `true` when the certificate is authentic and still valid. */
  get isValid(): boolean {
    return this.authentic && this.status === CertificateStatus.ACTIVE;
  }
}
