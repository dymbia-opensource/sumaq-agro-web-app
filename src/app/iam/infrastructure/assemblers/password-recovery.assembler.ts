import { RequestPasswordResetCommand } from '../../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../../domain/model/commands/reset-password.command';
import { PasswordRecoveryRequest, PasswordResetRequest } from '../requests/password-recovery.request';

/**
 * Maps password recovery commands into the payloads expected by the API.
 */
export class PasswordRecoveryAssembler {
  /**
   * Converts a recovery command into its request payload.
   * @param command - Command with the email of the account.
   * @returns Mapped request payload.
   */
  toRecoveryRequestFromCommand = (
    command: RequestPasswordResetCommand,
  ): PasswordRecoveryRequest => ({
    email: command.email,
  });

  /**
   * Converts a reset command into its request payload.
   * @param command - Command with the token and the new password.
   * @returns Mapped request payload.
   */
  toResetRequestFromCommand = (command: ResetPasswordCommand): PasswordResetRequest => ({
    token: command.token,
    newPassword: command.newPassword,
  });
}
