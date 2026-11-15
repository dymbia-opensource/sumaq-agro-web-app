import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { SignInCommand } from '../domain/model/commands/sign-in.command';
import { SignUpCommand } from '../domain/model/commands/sign-up.command';
import { RequestPasswordResetCommand } from '../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../domain/model/commands/reset-password.command';
import { AuthenticatedUser } from '../domain/model/entities/authenticated-user.entity';
import { User } from '../domain/model/entities/user.entity';
import { SignInApiEndpoint } from './endpoints/sign-in.endpoint';
import { SignUpApiEndpoint } from './endpoints/sign-up.endpoint';
import { PasswordRecoveryApiEndpoint } from './endpoints/password-recovery.endpoint';

/**
 * Exposes IAM operations to the application layer.
 */
@Injectable({ providedIn: 'root' })
export class IamApi extends BaseApi {
  private readonly signInEndpoint: SignInApiEndpoint;
  private readonly signUpEndpoint: SignUpApiEndpoint;
  private readonly passwordRecoveryEndpoint: PasswordRecoveryApiEndpoint;

  constructor() {
    super();

    const http = inject(HttpClient);

    this.signInEndpoint = new SignInApiEndpoint(http);
    this.signUpEndpoint = new SignUpApiEndpoint(http);
    this.passwordRecoveryEndpoint = new PasswordRecoveryApiEndpoint(http);
  }

  signIn(command: SignInCommand): Observable<AuthenticatedUser> {
    return this.signInEndpoint.signIn(command);
  }

  signUp(command: SignUpCommand): Observable<User> {
    return this.signUpEndpoint.signUp(command);
  }

  requestPasswordReset(command: RequestPasswordResetCommand): Observable<void> {
    return this.passwordRecoveryEndpoint.requestReset(command);
  }

  get isPasswordRecoveryPreview(): boolean {
    return this.passwordRecoveryEndpoint.isPreview;
  }

  resetPassword(command: ResetPasswordCommand): Observable<void> {
    return this.passwordRecoveryEndpoint.reset(command);
  }
}
