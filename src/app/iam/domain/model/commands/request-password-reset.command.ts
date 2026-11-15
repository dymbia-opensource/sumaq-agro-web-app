/** Captures the account email used to request password recovery. */
export class RequestPasswordResetCommand {
  readonly email: string;

  constructor(props: { email: string }) {
    this.email = props.email.trim();
  }
}
