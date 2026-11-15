import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SignInCommand } from '../../domain/model/commands/sign-in.command';
import { AuthenticatedUser } from '../../domain/model/entities/authenticated-user.entity';
import { SignInAssembler } from '../assemblers/sign-in.assembler';
import { SignInResponse } from '../responses/sign-in.response';

/**
 * Encapsulates sign-in HTTP operations.
 */
export class SignInApiEndpoint {
  private readonly endpointUrl =
    `${environment.platformProviderApiBaseUrl}` +
    `${environment.platformProviderSignInEndpointPath}`;

  private readonly assembler = new SignInAssembler();

  constructor(private readonly http: HttpClient) {}

  signIn(command: SignInCommand): Observable<AuthenticatedUser> {
    const request = this.assembler.toRequestFromCommand(command);

    return this.http
      .post<SignInResponse>(this.endpointUrl, request)
      .pipe(map((response) => this.assembler.toEntityFromResponse(response)));
  }
}
