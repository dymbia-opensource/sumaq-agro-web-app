import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SignUpCommand } from '../../domain/model/commands/sign-up.command';
import { SignUpAssembler } from '../assemblers/sign-up.assembler';
import { SignUpResource, SignUpResponse } from '../responses/sign-up.response';

const signUpApiEndpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignUpEndpointPath}`;

/**
 * Encapsulates IAM sign-up HTTP operations.
 *
 * @remarks
 * HTTP errors reach the store untouched, so it can tell an email already in
 * use (409) from other failures.
 */
export class SignUpApiEndpoint {
  /**
   * Creates an instance of SignUpApiEndpoint.
   * @param http - The HttpClient for making HTTP requests.
   * @param assembler - The assembler for converting between commands, requests, and responses.
   */
  constructor(
    private http: HttpClient,
    private assembler: SignUpAssembler,
  ) {}

  /**
   * Registers a new user in the remote IAM endpoint.
   * @param signUpCommand - Command containing the sign-up values.
   * @returns Stream with the created user resource.
   */
  signUp = (signUpCommand: SignUpCommand): Observable<SignUpResource> => {
    const signUpRequest = this.assembler.toRequestFromCommand(signUpCommand);
    return this.http
      .post<SignUpResponse>(signUpApiEndpointUrl, signUpRequest)
      .pipe(map((response) => this.assembler.toResourceFromResponse(response)));
  };
}
