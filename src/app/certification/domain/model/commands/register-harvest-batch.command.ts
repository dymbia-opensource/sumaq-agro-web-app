import { HarvestCropType } from '../entities/crop-type';

/** Registers the harvest batch a cooperative member delivers. */
export class RegisterHarvestBatchCommand {
  readonly batchCode: string;
  readonly cooperativeId: number;
  readonly memberId: number;
  readonly plotId: number;
  readonly cropType: HarvestCropType;
  /** Harvest date in `YYYY-MM-DD` format. */
  readonly harvestedOn: string;

  constructor(props: {
    batchCode: string;
    cooperativeId: number;
    memberId: number;
    plotId: number;
    cropType: HarvestCropType;
    harvestedOn: string;
  }) {
    const batchCode = props.batchCode.trim();
    if (!batchCode || !props.harvestedOn) throw new Error('certification.workspace.invalid');
    this.batchCode = batchCode;
    this.cooperativeId = props.cooperativeId;
    this.memberId = props.memberId;
    this.plotId = props.plotId;
    this.cropType = props.cropType;
    this.harvestedOn = props.harvestedOn;
  }
}
