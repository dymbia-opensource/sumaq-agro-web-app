import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SignUpCommand } from '../../domain/model/commands/sign-up.command';
import { User } from '../../domain/model/entities/user.entity';
import { SignUpAssembler } from '../assemblers/sign-up.assembler';
import { SignUpResponse } from '../responses/sign-up.response';

/**
 * Encapsulates sign-up HTTP operations.
 */
export class SignUpApiEndpoint {
  private readonly endpointUrl =
    `${environment.platformProviderApiBaseUrl}` +
    `${environment.platformProviderSignUpEndpointPath}`;

  private readonly assembler = new SignUpAssembler();

  constructor(private readonly http: HttpClient) {}

  signUp(command: SignUpCommand): Observable<User> {
    const request = this.assembler.toRequestFromCommand(command);

    return this.http
      .post<SignUpResponse>(this.endpointUrl, request)
      .pipe(map((response) => this.assembler.toEntityFromResponse(response)));
  }
}
