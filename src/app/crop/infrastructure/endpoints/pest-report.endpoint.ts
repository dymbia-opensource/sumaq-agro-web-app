import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { PestReport } from '../../domain/model/entities/pest-report.entity';
import { PestReportAssembler } from '../assemblers/pest-report.assembler';
import { PestReportResource, PestReportsResponse } from '../responses/pest-report.response';

/**
 * HTTP endpoint for managing pest reports data (`/pest-reports`).
 */
export class PestReportsApiEndpoint extends BaseApiEndpoint<
  PestReport,
  PestReportResource,
  PestReportsResponse,
  PestReportAssembler
> {
  /**
   * Initializes the endpoint with the configured environment URL.
   * @param http - Angular's HttpClient.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderPestReportsEndpointPath}`,
      new PestReportAssembler(),
    );
  }

  /**
   * Fetches all pest reports associated with a specific plot.
   * @param plotId - The unique identifier of the plot.
   * @returns An observable of the domain entities.
   */
  getByPlot(plotId: number): Observable<PestReport[]> {
    const params = new HttpParams().set('plotId', plotId);
    return this.http
      .get<PestReportsResponse | PestReportResource[]>(this.endpointUrl, { params })
      .pipe(
        map((response) => this.toEntities(response)),
        catchError(this.handleError('Failed to fetch pest reports')),
      );
  }

  /** Lets the API assign the ID of a new record. */
  override create(entity: PestReport): Observable<PestReport> {
    const { id: _id, ...resource } = this.assembler.toResourceFromEntity(entity);
    return this.http.post<PestReportResource>(this.endpointUrl, resource).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create pest-report')),
    );
  }
}
