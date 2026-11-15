import { SignUpCommand } from '../../domain/model/commands/sign-up.command';
import { User } from '../../domain/model/entities/user.entity';
import { SignUpRequest } from '../requests/sign-up.request';
import { SignUpResponse } from '../responses/sign-up.response';
import { UserRoleAssembler } from './user-role.assembler';

/**
 * Maps sign-up commands and API responses.
 */
export class SignUpAssembler {
  toRequestFromCommand(command: SignUpCommand): SignUpRequest {
    return {
      email: command.email,
      password: command.password,
      roles: [UserRoleAssembler.toResource(command.role)],
      profile: {
        firstName: command.firstName,
        lastName: command.lastName,
      },
    };
  }

  toEntityFromResponse(response: SignUpResponse): User {
    return new User({
      id: response.id,
      email: response.email,
      roles: response.roles.map((role) => UserRoleAssembler.toDomain(role)),
    });
  }
}
