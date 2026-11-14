import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface SatelliteObservationResource extends BaseResource {
  id: number;
  plotId: number;
  date: string;
  ndviMean: number;
  ndwiMean: number;
  surfaceTempKelvin: number;
  cloudCoveragePercent: number;
  stressAreaHectares?: number;
  recommendation?: string;
}

export interface SatelliteObservationsResponse extends BaseResponse {
  observations: SatelliteObservationResource[];
}
