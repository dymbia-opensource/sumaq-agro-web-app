/**
 * Asks for the PDF cost report of a campaign.
 */
export class ExportCampaignCostReportCommand {
  readonly campaignId: number;

  constructor(props: { campaignId: number }) {
    this.campaignId = props.campaignId;
  }
}
