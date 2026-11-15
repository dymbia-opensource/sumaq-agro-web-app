import { requireId, requireRange, requireDate } from '../validation';
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Properties required to instantiate a {@link SatelliteObservation}.
 */
export interface SatelliteObservationProps {
  id?: number | string;
  plotId: number;
  date: string;
  ndviMean: number;
  ndwiMean: number;
  surfaceTempKelvin?: number;
  cloudCoveragePercent?: number;
  stressAreaHectares?: number;
  recommendation?: string;
}

/**
 * Domain entity representing remote sensing observations obtained from AgroMonitoring/Sentinel-2.
 *
 * @remarks
 * NDVI measures vegetation health, while NDWI measures water content and moisture stress.
 */
export class SatelliteObservation extends BaseEntity {
  private _plotId: number;
  private _date: string;
  private _ndviMean: number;
  private _ndwiMean: number;
  private _surfaceTempKelvin: number;
  private _cloudCoveragePercent: number;
  private _stressAreaHectares: number;
  private _recommendation: string;

  /**
   * Initializes a new instance of the {@link SatelliteObservation} class.
   *
   * @param props - Satellite observation data.
   */
  constructor(props: SatelliteObservationProps) {
    super({ id: props.id ?? 0 });
    requireId(props.plotId);
    requireDate(props.date);
    requireRange(props.ndviMean, -1, 1);
    requireRange(props.ndwiMean, -1, 1);
    if (props.cloudCoveragePercent !== undefined) requireRange(props.cloudCoveragePercent, 0, 100);
    if (props.surfaceTempKelvin !== undefined) requireRange(props.surfaceTempKelvin, 0);
    if (props.stressAreaHectares !== undefined) requireRange(props.stressAreaHectares, 0);
    this._plotId = props.plotId;
    this._date = props.date;
    this._ndviMean = props.ndviMean;
    this._ndwiMean = props.ndwiMean;
    this._surfaceTempKelvin = props.surfaceTempKelvin ?? 0;
    this._cloudCoveragePercent = props.cloudCoveragePercent ?? 0;
    this._stressAreaHectares = props.stressAreaHectares ?? 0;
    this._recommendation = props.recommendation ?? '';
  }

  /** Gets the plot identifier associated with the satellite imagery. */
  get plotId(): number {
    return this._plotId;
  }

  /** Gets the acquisition date of the satellite capture. */
  get date(): string {
    return this._date;
  }

  /** Gets the mean Normalized Difference Vegetation Index (NDVI) for crop health. */
  get ndviMean(): number {
    return this._ndviMean;
  }

  /** Gets the mean Normalized Difference Water Index (NDWI) for crop moisture. */
  get ndwiMean(): number {
    return this._ndwiMean;
  }

  /** Gets the surface temperature measured in Kelvin degrees. */
  get surfaceTempKelvin(): number {
    return this._surfaceTempKelvin;
  }

  /** Gets the percentage of cloud interference across the polygon. */
  get cloudCoveragePercent(): number {
    return this._cloudCoveragePercent;
  }

  /** Gets the estimated stressed area in hectares. */
  get stressAreaHectares(): number {
    return this._stressAreaHectares;
  }

  /** Gets the agronomic recommendation derived from the observation. */
  get recommendation(): string {
    return this._recommendation;
  }
}
