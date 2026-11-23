import { SignInCommand } from '../domain/model/sign-in.command';
import { User } from '../domain/model/user.entity';
import { SignInResource, SignInResponse } from './sign-in-response';
import { SignInRequest } from './sign-in.request';
import { UserRoleAssembler } from './user-role-assembler';

/**
 * Maps IAM sign-in commands and endpoint payloads.
 */
export class SignInAssembler {
  /**
   * Converts the endpoint response into a resource.
   * @param response - Raw response returned by the sign-in endpoint.
   * @returns Mapped sign-in resource.
   */
  toResourceFromResponse = (response: SignInResponse): SignInResource => ({
    id: response.id,
    email: response.email,
    roles: response.roles,
    token: response.token,
    fullName: response.fullName,
  });

  /**
   * Converts the sign-in resource into the authenticated user entity.
   * @param resource - Sign-in resource.
   * @returns The user entity, without its token.
   */
  toEntityFromResource = (resource: SignInResource): User =>
    new User({
      id: resource.id,
      email: resource.email,
      fullName: resource.fullName,
      roles: resource.roles.map(UserRoleAssembler.toRoleFromResource),
    });

  /**
   * Converts a sign-in command into the request payload expected by the API.
   * @param command - Domain command with credentials.
   * @returns Mapped request payload.
   */
  toRequestFromCommand = (command: SignInCommand): SignInRequest => ({
    email: command.email,
    password: command.password,
  });
}
