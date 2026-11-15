import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface SatelliteObservationResource extends BaseResource {
  id: number;
  plotId: number;
  capturedAt: string;
  source: string;
  ndviMean: number | null;
  ndwiMean: number | null;
  surfaceTempKelvin: number | null;
  cloudCoveragePercent: number | null;
}

export interface SatelliteObservationsResponse extends BaseResponse {
  observations: SatelliteObservationResource[];
}
