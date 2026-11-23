import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../../shared/infrastructure/error-handling-enabled-base-type';
import { FarmerProfile } from '../../domain/model/entities/farmer-profile.entity';
import { FarmerProfileAssembler } from '../assemblers/farmer-profile.assembler';
import { FarmerProfileResource } from '../responses/farmer-profile.response';

export class FarmerProfilesApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly url =
    environment.platformProviderApiBaseUrl + environment.platformProviderProfilesEndpointPath;
  private readonly assembler = new FarmerProfileAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  getByUser(userId: number): Observable<FarmerProfile> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<FarmerProfileResource[]>(this.url, { params }).pipe(
      catchError(this.handleError('Failed to fetch the farmer profile')),
      map((profiles) => {
        const profile = profiles[0];
        if (!profile) throw new Error('Farmer profile not found.');
        return this.assembler.toEntityFromResource(profile);
      }),
    );
  }

  update(profile: FarmerProfile): Observable<FarmerProfile> {
    const { firstName, lastName, phoneNumber } = profile;
    return this.http
      .patch<FarmerProfileResource>(this.url + '/' + profile.id, {
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
      })
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400) {
            const message = error.error?.details || error.error?.detail;
            if (typeof message === 'string' && message.trim()) {
              return throwError(() => new Error(message));
            }
          }
          return this.handleError('Failed to update the farmer profile')(error);
        }),
      );
  }
}
