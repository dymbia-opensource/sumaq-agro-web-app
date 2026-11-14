/**
 * Closes a crop campaign.
 */
export class CloseCropCampaignCommand {
  readonly campaignId: number;

  constructor(props: { campaignId: number }) {
    this.campaignId = props.campaignId;
  }
}
