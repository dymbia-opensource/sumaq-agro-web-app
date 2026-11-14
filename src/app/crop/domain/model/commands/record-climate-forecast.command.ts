/**
 * Command to store climate predictions for an agricultural region.
 */
export class RecordClimateForecastCommand {
  /** Monitored region or valley. */
  readonly region: string;
  /** Temperature forecast in Celsius. */
  readonly temperature: number;
  /** Probability of rain in percentage (0 to 100). */
  readonly rainChance: number;
  /** Target date of forecast. */
  readonly forecastDate: string;
  /** Data provider source. */
  readonly source?: string;

  /**
   * Initializes a new instance of {@link RecordClimateForecastCommand}.
   *
   * @param props - Command payload.
   */
  constructor(props: {
    region: string;
    temperature: number;
    rainChance: number;
    forecastDate: string;
    source?: string;
  }) {
    this.region = props.region;
    this.temperature = props.temperature;
    this.rainChance = props.rainChance;
    this.forecastDate = props.forecastDate;
    this.source = props.source ?? 'AgroMonitoring';
  }
}
