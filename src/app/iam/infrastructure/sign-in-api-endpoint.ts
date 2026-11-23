import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInAssembler } from './sign-in-assembler';
import { SignInResource, SignInResponse } from './sign-in-response';

const signInApiEndpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignInEndpointPath}`;

/**
 * Encapsulates IAM sign-in HTTP operations.
 *
 * @remarks
 * HTTP errors reach the store untouched, so it can tell wrong credentials
 * (401) from a server that cannot be reached (0).
 */
export class SignInApiEndpoint {
  /**
   * Creates an instance of SignInApiEndpoint.
   * @param http - The HttpClient for making HTTP requests.
   * @param assembler - The assembler for converting between commands, requests, and responses.
   */
  constructor(
    private http: HttpClient,
    private assembler: SignInAssembler,
  ) {}

  /**
   * Authenticates a user with the remote IAM endpoint.
   * @param signInCommand - Command containing email and password.
   * @returns Stream with the authenticated user resource and access token.
   */
  signIn = (signInCommand: SignInCommand): Observable<SignInResource> => {
    const signInRequest = this.assembler.toRequestFromCommand(signInCommand);
    return this.http
      .post<SignInResponse>(signInApiEndpointUrl, signInRequest)
      .pipe(map((response) => this.assembler.toResourceFromResponse(response)));
  };
}
