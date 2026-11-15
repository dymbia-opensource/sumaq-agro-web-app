import { CropType } from '../entities/crop-campaign.entity';

/**
 * Chooses the crop of a campaign.
 */
export class SelectCropTypeCommand {
  readonly campaignId: number;
  readonly cropType: CropType;

  constructor(props: { campaignId: number; cropType: CropType }) {
    this.campaignId = props.campaignId;
    this.cropType = props.cropType;
  }
}
