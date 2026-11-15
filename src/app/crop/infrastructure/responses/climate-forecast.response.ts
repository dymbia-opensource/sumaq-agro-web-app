import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface ClimateForecastResource extends BaseResource {
  id: number;
  region: string;
  temperatureCelsius: number;
  rainChance: number;
  forecastDate: string;
  source: string;
}

export interface ClimateForecastsResponse extends BaseResponse {
  forecasts: ClimateForecastResource[];
}
