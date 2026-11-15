/**
 * Command to record or synchronize a satellite imagery observation (NDVI/NDWI) for a plot.
 */
export class RecordSatelliteObservationCommand {
  /** Identifier of the plot monitored. */
  readonly plotId: number;
  /** Date of the satellite pass. */
  readonly date: string;
  /** Mean NDVI vegetation index value. */
  readonly ndviMean: number;
  /** Mean NDWI water/moisture index value. */
  readonly ndwiMean: number;
  /** Optional surface temperature in Kelvin. */
  readonly surfaceTempKelvin?: number;
  /** Optional percentage of cloud cover over the plot. */
  readonly cloudCoveragePercent?: number;

  /**
   * Initializes a new instance of {@link RecordSatelliteObservationCommand}.
   *
   * @param props - Command payload.
   */
  constructor(props: {
    plotId: number;
    date: string;
    ndviMean: number;
    ndwiMean: number;
    surfaceTempKelvin?: number;
    cloudCoveragePercent?: number;
  }) {
    this.plotId = props.plotId;
    this.date = props.date;
    this.ndviMean = props.ndviMean;
    this.ndwiMean = props.ndwiMean;
    this.surfaceTempKelvin = props.surfaceTempKelvin;
    this.cloudCoveragePercent = props.cloudCoveragePercent;
  }
}
