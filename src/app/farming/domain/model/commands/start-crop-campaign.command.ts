/**
 * Starts a new crop campaign on a plot.
 */
export class StartCropCampaignCommand {
  readonly plotId: number;
  /** Agricultural season, for example `2026-I`. */
  readonly season: string;

  constructor(props: { plotId: number; season: string }) {
    this.plotId = props.plotId;
    this.season = props.season;
  }
}
