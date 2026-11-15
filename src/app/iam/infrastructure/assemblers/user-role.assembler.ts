import { UserRole } from '../../domain/model/entities/user-role';

/**
 * Maps domain roles to and from the provisional API contract.
 */
export class UserRoleAssembler {
  static toResource(role: UserRole): string {
    return `ROLE_${role}`;
  }

  static toDomain(role: string): UserRole {
    switch (role) {
      case 'ROLE_FARMER':
        return 'FARMER';

      case 'ROLE_COOPERATIVE_DIRECTOR':
        return 'COOPERATIVE_DIRECTOR';

      case 'ROLE_AGRONOMIST':
        return 'AGRONOMIST';

      default:
        throw new Error(`Unsupported IAM role: ${role}`);
    }
  }
}
