import { SignInCommand } from '../../domain/model/commands/sign-in.command';
import { AuthenticatedUser } from '../../domain/model/entities/authenticated-user.entity';
import { SignInRequest } from '../requests/sign-in.request';
import { SignInResponse } from '../responses/sign-in.response';
import { UserRoleAssembler } from './user-role.assembler';

/**
 * Maps sign-in commands and API responses.
 */
export class SignInAssembler {
  toRequestFromCommand(command: SignInCommand): SignInRequest {
    return {
      email: command.email,
      password: command.password,
    };
  }

  toEntityFromResponse(response: SignInResponse): AuthenticatedUser {
    return new AuthenticatedUser({
      id: response.id,
      email: response.email,
      fullName: response.fullName,
      roles: response.roles.map((role) => UserRoleAssembler.toDomain(role)),
      token: response.token,
    });
  }
}
