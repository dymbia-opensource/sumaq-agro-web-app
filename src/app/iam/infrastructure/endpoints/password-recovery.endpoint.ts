import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RequestPasswordResetCommand } from '../../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../../domain/model/commands/reset-password.command';
import { PasswordRecoveryAssembler } from '../assemblers/password-recovery.assembler';

const passwordRecoveryApiEndpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderPasswordRecoveryEndpointPath}`;

/**
 * Encapsulates IAM password recovery HTTP operations.
 *
 * @remarks
 * HTTP errors reach the store untouched, so it can tell an expired link from
 * a rejected request.
 */
export class PasswordRecoveryApiEndpoint {
  /**
   * Creates an instance of PasswordRecoveryApiEndpoint.
   * @param http - The HttpClient for making HTTP requests.
   * @param assembler - The assembler for converting commands into requests.
   */
  constructor(
    private http: HttpClient,
    private assembler: PasswordRecoveryAssembler,
  ) {}

  /**
   * Asks the platform to email a recovery link.
   * @param command - Command with the email of the account.
   * @returns Completion stream.
   */
  requestReset = (command: RequestPasswordResetCommand): Observable<void> =>
    this.http.post<void>(
      `${passwordRecoveryApiEndpointUrl}/request`,
      this.assembler.toRecoveryRequestFromCommand(command),
    );

  /**
   * Sets a new password with the token of the recovery link.
   * @param command - Command with the token and the new password.
   * @returns Completion stream.
   */
  reset = (command: ResetPasswordCommand): Observable<void> =>
    this.http.post<void>(
      `${passwordRecoveryApiEndpointUrl}/reset`,
      this.assembler.toResetRequestFromCommand(command),
    );
}
