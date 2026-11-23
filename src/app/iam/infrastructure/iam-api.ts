import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { RequestPasswordResetCommand } from '../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../domain/model/commands/reset-password.command';
import { SignInCommand } from '../domain/model/commands/sign-in.command';
import { SignUpCommand } from '../domain/model/commands/sign-up.command';
import { PasswordRecoveryApiEndpoint } from './endpoints/password-recovery.endpoint';
import { PasswordRecoveryAssembler } from './assemblers/password-recovery.assembler';
import { SignInApiEndpoint } from './endpoints/sign-in.endpoint';
import { SignInAssembler } from './assemblers/sign-in.assembler';
import { SignInResource } from './responses/sign-in.response';
import { SignUpApiEndpoint } from './endpoints/sign-up.endpoint';
import { SignUpAssembler } from './assemblers/sign-up.assembler';
import { SignUpResource } from './responses/sign-up.response';

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
