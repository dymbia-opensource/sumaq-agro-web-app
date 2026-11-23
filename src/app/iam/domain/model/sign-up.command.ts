import { UserRole } from './user-role';

/**
 * Captures the information required to register an account.
 */
export class SignUpCommand {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;

  constructor(props: {
    email: string;
    password: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  }) {
    this.firstName = props.firstName.trim();
    this.lastName = props.lastName.trim();
    this.email = props.email.trim();
    this.password = props.password;
    this.role = props.role;
  }
}
