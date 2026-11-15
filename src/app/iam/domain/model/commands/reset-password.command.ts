/** Captures the recovery token and the new password, preserving password whitespace. */
export class ResetPasswordCommand {
  readonly token: string;
  readonly newPassword: string;

  constructor(props: { token: string; newPassword: string }) {
    this.token = props.token.trim();
    this.newPassword = props.newPassword;
  }
}
