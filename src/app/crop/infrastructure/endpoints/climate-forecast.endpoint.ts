import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { ClimateForecast } from '../../domain/model/entities/climate-forecast.entity';
import { ClimateForecastAssembler } from '../assemblers/climate-forecast.assembler';
import { ImportClimateForecastRequest } from '../requests/import-climate-forecast.request';
import {
  ClimateForecastResource,
  ClimateForecastsResponse,
} from '../responses/climate-forecast.response';

/**
 * HTTP endpoint for managing weather and climate forecasts (`/climate-forecasts`).
 */
export class ClimateForecastsApiEndpoint extends BaseApiEndpoint<
  ClimateForecast,
  ClimateForecastResource,
  ClimateForecastsResponse,
  ClimateForecastAssembler
> {
  /**
   * Initializes the endpoint with the configured environment URL.
   * @param http - Angular's HttpClient.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderClimateForecastsEndpointPath}`,
      new ClimateForecastAssembler(),
    );
  }

  /**
   * Fetches the upcoming climate forecasts for a specific geographic region.
   * @param region - The name of the valley or region.
   * @returns An observable of the domain entities.
   */
  getByRegion(region: string): Observable<ClimateForecast[]> {
    const params = new HttpParams().set('region', region);
    return this.http
      .get<ClimateForecastsResponse | ClimateForecastResource[]>(this.endpointUrl, { params })
      .pipe(
        map((response) => this.toEntities(response)),
        catchError(this.handleError('Failed to fetch climate forecasts')),
      );
  }

  /**
   * Imports the 5-day forecast of a plot from AgroMonitoring.
   * @param plotId - Plot of the user, with its monitoring polygon.
   * @returns The forecasts recorded, one per day. Errors reach the store
   * untouched (404 without forecast, 409 without polygon).
   */
  importForPlot(plotId: number): Observable<ClimateForecast[]> {
    const request: ImportClimateForecastRequest = { plotId };
    return this.http
      .post<ClimateForecastResource[]>(`${this.endpointUrl}/imports`, request)
      .pipe(map((resources) => this.toEntities(resources)));
  }
}
