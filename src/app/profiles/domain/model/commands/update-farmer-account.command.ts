/** Updates personal and contact details without changing sign-in credentials. */
export class UpdateFarmerAccountCommand {
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumber: string;
  constructor(props: { firstName: string; lastName: string; phoneNumber: string }) {
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phoneNumber = props.phoneNumber;
  }
}
