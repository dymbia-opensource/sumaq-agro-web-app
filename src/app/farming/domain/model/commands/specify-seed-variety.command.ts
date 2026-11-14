/**
 * Chooses the seed variety of a campaign.
 */
export class SpecifySeedVarietyCommand {
  readonly campaignId: number;
  readonly varietyName: string;
  /** `true` when the producer typed a variety that is not in the list. */
  readonly custom: boolean;

  constructor(props: { campaignId: number; varietyName: string; custom: boolean }) {
    this.campaignId = props.campaignId;
    this.varietyName = props.varietyName;
    this.custom = props.custom;
  }
}
