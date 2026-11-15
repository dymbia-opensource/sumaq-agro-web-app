import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { UserRole } from './user-role';

/**
 * Represents a registered account in the IAM context.
 */
export class User extends BaseEntity {
  private readonly _email: string;
  private readonly _roles: readonly UserRole[];

  constructor(props: { id: number | string; email: string; roles: readonly UserRole[] }) {
    super({ id: props.id });

    const email = props.email.trim();

    if (!email) {
      throw new Error('User email is required.');
    }

    if (props.roles.length === 0) {
      throw new Error('User must have at least one role.');
    }

    this._email = email;
    this._roles = Object.freeze([...new Set(props.roles)]);
  }

  get email(): string {
    return this._email;
  }

  get roles(): readonly UserRole[] {
    return this._roles;
  }

  hasRole(role: UserRole): boolean {
    return this._roles.includes(role);
  }
}
