import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { RequestPasswordResetCommand } from '../domain/model/request-password-reset.command';
import { ResetPasswordCommand } from '../domain/model/reset-password.command';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { PasswordRecoveryApiEndpoint } from './password-recovery-api-endpoint';
import { PasswordRecoveryAssembler } from './password-recovery-assembler';
import { SignInApiEndpoint } from './sign-in-api-endpoint';
import { SignInAssembler } from './sign-in-assembler';
import { SignInResource } from './sign-in-response';
import { SignUpApiEndpoint } from './sign-up-api-endpoint';
import { SignUpAssembler } from './sign-up-assembler';
import { SignUpResource } from './sign-up-response';

/**
 * Infrastructure facade that exposes IAM endpoint operations.
 */
@Injectable({ providedIn: 'root' })
export class IamApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly signUpEndpoint = new SignUpApiEndpoint(this.http, new SignUpAssembler());
  private readonly signInEndpoint = new SignInApiEndpoint(this.http, new SignInAssembler());
  private readonly passwordRecoveryEndpoint = new PasswordRecoveryApiEndpoint(
    this.http,
    new PasswordRecoveryAssembler(),
  );

  /**
   * Registers a new user account.
   * @param signUpCommand - Command containing the account values.
   * @returns Stream with the created user resource.
   */
  signUp = (signUpCommand: SignUpCommand): Observable<SignUpResource> =>
    this.signUpEndpoint.signUp(signUpCommand);

  /**
   * Authenticates an existing user.
   * @param signInCommand - Command containing credential values.
   * @returns Stream with the authenticated user resource and token.
   */
  signIn = (signInCommand: SignInCommand): Observable<SignInResource> =>
    this.signInEndpoint.signIn(signInCommand);

  /**
   * Asks for a recovery email.
   * @param command - Command with the email of the account.
   * @returns Completion stream.
   */
  requestPasswordReset = (command: RequestPasswordResetCommand): Observable<void> =>
    this.passwordRecoveryEndpoint.requestReset(command);

  /**
   * Sets a new password with a recovery token.
   * @param command - Command with the token and the new password.
   * @returns Completion stream.
   */
  resetPassword = (command: ResetPasswordCommand): Observable<void> =>
    this.passwordRecoveryEndpoint.reset(command);
}
