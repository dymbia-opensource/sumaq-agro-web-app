import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { FieldInspection } from '../../domain/model/entities/field-inspection.entity';
import { FieldInspectionAssembler } from '../assemblers/field-inspection.assembler';
import {
  FieldInspectionResource,
  FieldInspectionsResponse,
} from '../responses/field-inspection.response';

/**
 * HTTP endpoint for managing scheduled field inspections (`/field-inspections`).
 */
export class FieldInspectionsApiEndpoint extends BaseApiEndpoint<
  FieldInspection,
  FieldInspectionResource,
  FieldInspectionsResponse,
  FieldInspectionAssembler
> {
  /**
   * Initializes the endpoint with the configured environment URL.
   * @param http - Angular's HttpClient.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderFieldInspectionsEndpointPath}`,
      new FieldInspectionAssembler(),
    );
  }

  /**
   * Fetches field inspections linked to a specific pest report.
   * @param reportId - The unique identifier of the pest report.
   * @returns An observable of the domain entities.
   */
  getByReportId(reportId: number): Observable<FieldInspection[]> {
    const params = new HttpParams().set('reportId', reportId);
    return this.http
      .get<FieldInspectionsResponse | FieldInspectionResource[]>(this.endpointUrl, { params })
      .pipe(
        map((response) => this.toEntities(response)),
        catchError(this.handleError('Failed to fetch field inspections')),
      );
  }

  /** Lets the API assign the ID of a new record. */
  override create(entity: FieldInspection): Observable<FieldInspection> {
    const { id: _id, ...resource } = this.assembler.toResourceFromEntity(entity);
    return this.http.post<FieldInspectionResource>(this.endpointUrl, resource).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create field-inspection')),
    );
  }
}
