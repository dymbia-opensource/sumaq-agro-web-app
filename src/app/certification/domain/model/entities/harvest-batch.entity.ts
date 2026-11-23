import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { BatchStatus } from './batch-status';
import { HarvestCropType } from './crop-type';
import { QualityCategory } from './quality-category';

/**
 * Harvest batch delivered by a cooperative member: it is weighed, sampled,
 * graded (potato calibers or coffee cupping) and finally certified.
 */
export class HarvestBatch extends BaseEntity {
  readonly batchCode: string;
  readonly cooperativeId: number;
  readonly memberId: number;
  readonly plotId: number;
  readonly cropType: HarvestCropType;
  /** Harvest date in `YYYY-MM-DD` format. */
  readonly harvestedOn: string;
  readonly status: BatchStatus;
  /** Gross weight minus tare, or `null` before weighing. */
  readonly netWeightKg: number | null;
  readonly sampleIdentifier: string | null;
  readonly sampleWeightKg: number | null;
  readonly qualityScore: number | null;
  readonly qualityCategory: QualityCategory | null;

  constructor(props: {
    id: number;
    batchCode: string;
    cooperativeId: number;
    memberId: number;
    plotId: number;
    cropType: HarvestCropType;
    harvestedOn: string;
    status: BatchStatus;
    netWeightKg: number | null;
    sampleIdentifier: string | null;
    sampleWeightKg: number | null;
    qualityScore: number | null;
    qualityCategory: QualityCategory | null;
  }) {
    super({ id: props.id });
    this.batchCode = props.batchCode;
    this.cooperativeId = props.cooperativeId;
    this.memberId = props.memberId;
    this.plotId = props.plotId;
    this.cropType = props.cropType;
    this.harvestedOn = props.harvestedOn;
    this.status = props.status;
    this.netWeightKg = props.netWeightKg;
    this.sampleIdentifier = props.sampleIdentifier;
    this.sampleWeightKg = props.sampleWeightKg;
    this.qualityScore = props.qualityScore;
    this.qualityCategory = props.qualityCategory;
  }

  /** Identifier of the batch in the platform. */
  get batchId(): number {
    return this.id as number;
  }

  /** `true` once the delivered batch was weighed. */
  get isWeighed(): boolean {
    return this.netWeightKg !== null;
  }

  /** `true` once a representative sample was taken. */
  get isSampled(): boolean {
    return this.sampleIdentifier !== null;
  }

  /** `true` when the batch has a quality category and no certificate yet. */
  get canBeCertified(): boolean {
    return this.status === BatchStatus.GRADED && this.qualityCategory !== null;
  }

  /**
   * Returns the same batch in another state (for example, CERTIFIED after
   * a certificate is issued).
   * @param status - New state.
   */
  withStatus(status: BatchStatus): HarvestBatch {
    return new HarvestBatch({ ...this, id: this.batchId, status });
  }
}
