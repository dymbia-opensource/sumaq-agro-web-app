import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { AgroclimaticAlert } from '../../domain/model/entities/agroclimatic-alert.entity';
import { AgroclimaticAlertAssembler } from '../assemblers/agroclimatic-alert.assembler';
import {
  AgroclimaticAlertResource,
  AgroclimaticAlertsResponse,
} from '../responses/agroclimatic-alert.response';

/**
 * HTTP endpoint for managing agroclimatic alerts (`/agroclimatic-alerts`).
 */
export class AgroclimaticAlertsApiEndpoint extends BaseApiEndpoint<
  AgroclimaticAlert,
  AgroclimaticAlertResource,
  AgroclimaticAlertsResponse,
  AgroclimaticAlertAssembler
> {
  /**
   * Initializes the endpoint with the configured environment URL.
   * @param http - Angular's HttpClient.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderAgroclimaticAlertsEndpointPath}`,
      new AgroclimaticAlertAssembler(),
    );
  }

  /**
   * Fetches active agroclimatic alerts for a specific geographic region.
   * @param region - The name of the valley or region.
   * @returns An observable of the domain entities.
   */
  getByRegion(region: string): Observable<AgroclimaticAlert[]> {
    const params = new HttpParams().set('region', region);
    return this.http
      .get<AgroclimaticAlertsResponse | AgroclimaticAlertResource[]>(this.endpointUrl, { params })
      .pipe(
        map((response) => this.toEntities(response)),
        catchError(this.handleError('Failed to fetch agroclimatic alerts')),
      );
  }
}
