import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { TechnicalAdvisor } from '../../domain/model/entities/technical-advisor.entity';
import { TechnicalAdvisorAssembler } from '../assemblers/technical-advisor.assembler';
import {
  TechnicalAdvisorResource,
  TechnicalAdvisorsResponse,
} from '../responses/technical-advisor.response';

/** HTTP endpoint for technical advisor assignments. */
export class TechnicalAdvisorsApiEndpoint extends BaseApiEndpoint<
  TechnicalAdvisor,
  TechnicalAdvisorResource,
  TechnicalAdvisorsResponse,
  TechnicalAdvisorAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderTechnicalAdvisorsEndpointPath}`,
      new TechnicalAdvisorAssembler(),
    );
  }

  getByCooperative(cooperativeId: number): Observable<TechnicalAdvisor[]> {
    const params = new HttpParams().set('cooperativeId', cooperativeId);
    return this.http.get<TechnicalAdvisorResource[]>(this.endpointUrl, { params }).pipe(
      map((advisors) => advisors.map((advisor) => this.assembler.toEntityFromResource(advisor))),
      catchError(this.handleError('Failed to fetch technical advisors')),
    );
  }
  getByUser(userId: number): Observable<TechnicalAdvisor | null> {
    return this.getAllBy({ userId }).pipe(map((advisors) => advisors[0] ?? null));
  }
}
