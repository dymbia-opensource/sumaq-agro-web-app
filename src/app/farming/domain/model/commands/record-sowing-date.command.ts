/**
 * Records the sowing date. It starts the satellite monitoring (policy P4).
 */
export class RecordSowingDateCommand {
  readonly campaignId: number;
  readonly sowingDate: Date;

  constructor(props: { campaignId: number; sowingDate: Date }) {
    this.campaignId = props.campaignId;
    this.sowingDate = props.sowingDate;
  }
}
