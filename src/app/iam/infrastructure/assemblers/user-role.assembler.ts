import { UserRole } from '../../domain/model/entities/user-role';

/**
 * Maps the roles of the domain to and from the `ROLE_*` names of the API.
 */
export class UserRoleAssembler {
  /**
   * Converts an API role into a domain role.
   * @param role - Role name returned by the API (for example `ROLE_FARMER`).
   * @returns The domain role.
   */
  static toRoleFromResource = (role: string): UserRole => role.replace(/^ROLE_/, '') as UserRole;

  /**
   * Converts a domain role into the role name expected by the API.
   * @param role - Domain role.
   * @returns The API role name.
   */
  static toResourceFromRole = (role: UserRole): string => `ROLE_${role}`;
}
