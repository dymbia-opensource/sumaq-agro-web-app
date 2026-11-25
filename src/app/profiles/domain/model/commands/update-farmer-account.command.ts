/** Updates personal and contact details without changing sign-in credentials. */
export class UpdateFarmerAccountCommand {
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumber: string;
  /** Eight digits, or empty to remove it. */
  readonly dni: string;
  constructor(props: { firstName: string; lastName: string; phoneNumber: string; dni?: string }) {
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phoneNumber = props.phoneNumber;
    this.dni = props.dni ?? '';
  }
}
