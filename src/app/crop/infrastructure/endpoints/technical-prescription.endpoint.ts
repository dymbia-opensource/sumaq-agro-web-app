import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { TechnicalPrescription } from '../../domain/model/entities/technical-prescription.entity';
import { TechnicalPrescriptionAssembler } from '../assemblers/technical-prescription.assembler';
import {
  TechnicalPrescriptionResource,
  TechnicalPrescriptionsResponse,
} from '../responses/technical-prescription.response';

/**
 * HTTP endpoint for managing agronomist prescriptions (`/technical-prescriptions`).
 */
export class TechnicalPrescriptionsApiEndpoint extends BaseApiEndpoint<
  TechnicalPrescription,
  TechnicalPrescriptionResource,
  TechnicalPrescriptionsResponse,
  TechnicalPrescriptionAssembler
> {
  /**
   * Initializes the endpoint with the configured environment URL.
   * @param http - Angular's HttpClient.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderTechnicalPrescriptionsEndpointPath}`,
      new TechnicalPrescriptionAssembler(),
    );
  }

  /**
   * Fetches the technical prescriptions issued for a specific pest report.
   * @param reportId - The unique identifier of the pest report.
   * @returns An observable of the domain entities.
   */
  getByReportId(reportId: number): Observable<TechnicalPrescription[]> {
    const params = new HttpParams().set('reportId', reportId);
    return this.http
      .get<TechnicalPrescriptionsResponse | TechnicalPrescriptionResource[]>(this.endpointUrl, {
        params,
      })
      .pipe(
        map((response) => this.toEntities(response)),
        catchError(this.handleError('Failed to fetch prescriptions')),
      );
  }

  /** Lets the API assign the ID of a new record. */
  override create(entity: TechnicalPrescription): Observable<TechnicalPrescription> {
    const { id: _id, ...resource } = this.assembler.toResourceFromEntity(entity);
    return this.http.post<TechnicalPrescriptionResource>(this.endpointUrl, resource).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create technical-prescription')),
    );
  }
}
