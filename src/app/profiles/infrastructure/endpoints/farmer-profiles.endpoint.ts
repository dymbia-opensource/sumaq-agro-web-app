import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { FarmerProfile } from '../../domain/model/entities/farmer-profile.entity';
import { FarmerProfileAssembler } from '../assemblers/farmer-profile.assembler';
import {
  FarmerProfileResource,
  FarmerProfilesResponse,
} from '../responses/farmer-profile.response';

/** HTTP endpoint for the farmer Profiles resource. */
export class FarmerProfilesApiEndpoint extends BaseApiEndpoint<
  FarmerProfile,
  FarmerProfileResource,
  FarmerProfilesResponse,
  FarmerProfileAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderProfilesEndpointPath}`,
      new FarmerProfileAssembler(),
    );
  }

  /** Loads the profile associated with a user account. */
  getByUser(userId: number): Observable<FarmerProfile> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<FarmerProfileResource[]>(this.endpointUrl, { params }).pipe(
      map((profiles) => {
        const profile = profiles[0];
        if (!profile) throw new Error('Farmer profile not found.');
        return this.assembler.toEntityFromResource(profile);
      }),
      catchError(this.handleError('Failed to fetch the farmer profile')),
    );
  }
}
