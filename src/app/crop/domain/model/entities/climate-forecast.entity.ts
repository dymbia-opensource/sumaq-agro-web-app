import { requireText, requireRange, requireDate } from '../validation';
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Properties required to instantiate a {@link ClimateForecast}.
 */
export interface ClimateForecastProps {
  id?: number | string;
  region: string;
  temperature: number;
  rainChance: number;
  forecastDate: string;
  source?: string;
}

/**
 * Domain entity representing weather forecast predictions for an agricultural valley.
 */
export class ClimateForecast extends BaseEntity {
  private _region: string;
  private _temperature: number;
  private _rainChance: number;
  private _forecastDate: string;
  private _source: string;

  /**
   * Initializes a new instance of the {@link ClimateForecast} class.
   *
   * @param props - Climate forecast properties.
   */
  constructor(props: ClimateForecastProps) {
    super({ id: props.id ?? 0 });
    requireText(props.region);
    requireRange(props.temperature, -273.15);
    requireRange(props.rainChance, 0, 100);
    requireDate(props.forecastDate);
    this._region = props.region;
    this._temperature = props.temperature;
    this._rainChance = props.rainChance;
    this._forecastDate = props.forecastDate;
    this._source = props.source ?? 'AgroMonitoring';
  }

  /** Gets the valley or geographic region of the forecast. */
  get region(): string {
    return this._region;
  }

  /** Gets the expected temperature in degrees Celsius. */
  get temperature(): number {
    return this._temperature;
  }

  /** Gets the estimated percentage probability of rain (0 to 100). */
  get rainChance(): number {
    return this._rainChance;
  }

  /** Gets the date for which the prediction applies. */
  get forecastDate(): string {
    return this._forecastDate;
  }

  /** Gets the weather provider source. */
  get source(): string {
    return this._source;
  }
}
