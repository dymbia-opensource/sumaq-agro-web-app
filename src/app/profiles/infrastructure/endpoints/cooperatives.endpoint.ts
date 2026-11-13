import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Cooperative } from '../../domain/model/entities/cooperative.entity';
import { CooperativeAssembler } from '../assemblers/cooperative.assembler';
import { CooperativeResource, CooperativesResponse } from '../responses/cooperative.response';

/** HTTP endpoint for institutional cooperative data. */
export class CooperativesApiEndpoint extends BaseApiEndpoint<
  Cooperative,
  CooperativeResource,
  CooperativesResponse,
  CooperativeAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}${environment.platformProviderCooperativesEndpointPath}`, new CooperativeAssembler());
  }

  register(directorUserId: number, legalName: string, ruc: string, region: string): Observable<unknown> {
    return this.http.post(this.endpointUrl, {
      directorUserId,
      legalName,
      ruc,
      region,
      institutionalEmail: '',
      legalRepresentative: '',
      headquartersAddress: '',
      switchboardPhone: '',
    });
  }

  getByDirector(userId: number): Observable<Cooperative | null> {
    const params = new HttpParams().set('directorUserId', userId);
    return this.http.get<CooperativeResource[]>(this.endpointUrl, { params }).pipe(
      map((cooperatives) => cooperatives[0] ? this.assembler.toEntityFromResource(cooperatives[0]) : null),
      catchError(this.handleError('Failed to fetch the cooperative')),
    );
  }

}
