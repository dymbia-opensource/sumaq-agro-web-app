import { RequestPasswordResetCommand } from '../../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../../domain/model/commands/reset-password.command';
import { ForgotPasswordRequest } from '../requests/forgot-password.request';
import { ResetPasswordRequest } from '../requests/reset-password.request';

/** Maps recovery commands to the provisional backend payloads. */
export class PasswordRecoveryAssembler {
  toForgotPasswordRequest(command: RequestPasswordResetCommand): ForgotPasswordRequest {
    return { email: command.email };
  }

  toResetPasswordRequest(command: ResetPasswordCommand): ResetPasswordRequest {
    return {
      token: command.token,
      newPassword: command.newPassword,
    };
  }
}
