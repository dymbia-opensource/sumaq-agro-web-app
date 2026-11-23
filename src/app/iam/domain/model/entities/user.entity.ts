import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { UserRole } from './user-role';

/**
 * Represents an account of the IAM context.
 */
export class User extends BaseEntity {
  private readonly _email: string;
  private readonly _fullName: string;
  private readonly _roles: readonly UserRole[];

  /**
   * Creates a new user entity.
   * @param props - Initialization values.
   */
  constructor(props: {
    id: number;
    email: string;
    fullName?: string | null;
    roles: readonly UserRole[];
  }) {
    super({ id: props.id });
    this._email = props.email.trim();
    this._fullName = props.fullName?.trim() ?? '';
    this._roles = Object.freeze([...new Set(props.roles)]);
  }

  /** Email the user signs in with. */
  get email(): string {
    return this._email;
  }

  /** Name of the profile of the user; empty when unknown. */
  get fullName(): string {
    return this._fullName;
  }

  /** Roles granted to the user. */
  get roles(): readonly UserRole[] {
    return this._roles;
  }

  /**
   * Checks whether the user has a role.
   * @param role - Role to check.
   * @returns True if the user has the role.
   */
  hasRole(role: UserRole): boolean {
    return this._roles.includes(role);
  }
}
