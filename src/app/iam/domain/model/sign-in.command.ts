/**
 * Captures the credentials required to sign in.
 */
export class SignInCommand {
  readonly email: string;
  readonly password: string;

  constructor(props: { email: string; password: string }) {
    this.email = props.email.trim();
    this.password = props.password;
  }
}
