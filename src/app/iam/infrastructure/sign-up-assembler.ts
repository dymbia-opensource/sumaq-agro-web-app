import { SignUpCommand } from '../domain/model/sign-up.command';
import { SignUpResource, SignUpResponse } from './sign-up-response';
import { SignUpRequest } from './sign-up.request';
import { UserRoleAssembler } from './user-role-assembler';

/**
 * Maps IAM sign-up commands and endpoint payloads.
 */
export class SignUpAssembler {
  /**
   * Converts the endpoint response into a resource.
   * @param response - Raw response returned by the sign-up endpoint.
   * @returns Mapped sign-up resource.
   */
  toResourceFromResponse = (response: SignUpResponse): SignUpResource => ({
    id: response.id,
    email: response.email,
    roles: response.roles,
  });

  /**
   * Converts a sign-up command into the request payload expected by the API.
   * @param command - Domain command with the account and profile values.
   * @returns Mapped request payload.
   */
  toRequestFromCommand = (command: SignUpCommand): SignUpRequest => ({
    email: command.email,
    password: command.password,
    roles: [UserRoleAssembler.toResourceFromRole(command.role)],
    profile: {
      firstName: command.firstName,
      lastName: command.lastName,
    },
  });
}
