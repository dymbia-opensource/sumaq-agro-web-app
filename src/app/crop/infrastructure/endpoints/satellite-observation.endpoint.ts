import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { SatelliteObservation } from '../../domain/model/entities/satellite-observation.entity';
import { SatelliteObservationAssembler } from '../assemblers/satellite-observation.assembler';
import {
  SatelliteObservationResource,
  SatelliteObservationsResponse,
} from '../responses/satellite-observation.response';

/**
 * HTTP endpoint for managing remote sensing and satellite data (`/satellite-observations`).
 */
export class SatelliteObservationsApiEndpoint extends BaseApiEndpoint<
  SatelliteObservation,
  SatelliteObservationResource,
  SatelliteObservationsResponse,
  SatelliteObservationAssembler
> {
  /**
   * Initializes the endpoint with the configured environment URL.
   * @param http - Angular's HttpClient.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSatelliteObservationsEndpointPath}`,
      new SatelliteObservationAssembler(),
    );
  }

  /**
   * Fetches all satellite observations associated with a specific plot.
   * @param plotId - The unique identifier of the plot.
   * @returns An observable of the domain entities.
   */
  getByPlot(plotId: number): Observable<SatelliteObservation[]> {
    const params = new HttpParams().set('plotId', plotId);
    return this.http
      .get<SatelliteObservationsResponse | SatelliteObservationResource[]>(this.endpointUrl, {
        params,
      })
      .pipe(
        map((response) => this.toEntities(response)),
        catchError(this.handleError('Failed to fetch satellite observations')),
      );
  }
  importLatest(plotId: number, start: string, end: string): Observable<SatelliteObservation> {
    return this.http
      .post<SatelliteObservationResource>(this.endpointUrl + '/import', { plotId, start, end })
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }
}
