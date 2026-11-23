import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Contact and account preferences of an independent farmer.
 *
 * @remarks
 * Authentication credentials do not belong here. They are intentionally left
 * for IAM, which is outside the scope of the current delivery.
 */
export class FarmerProfile extends BaseEntity {
  private readonly _userId: number;
  private _phoneNumber: string;
  private readonly _email: string;
  private _firstName: string;
  private _lastName: string;
  private _dni: string;

  constructor(props: {
    id: number;
    userId: number;
    phoneNumber: string;
    email: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
  }) {
    super({ id: props.id });
    this._userId = props.userId;
    this._firstName = props.firstName?.trim() ?? '';
    this._lastName = props.lastName?.trim() ?? '';
    this._phoneNumber = props.phoneNumber.trim();
    this._email = props.email;
    this._dni = props.dni?.trim() ?? '';
  }

  /** DNI the producer added so the cooperative does not have to type it; empty when he did not. */
  get dni(): string {
    return this._dni;
  }

  /**
   * Replaces the DNI; an empty value removes it.
   * @param value - Eight digits, or empty.
   */
  updateDni(value: string): void {
    const dni = value.trim();
    if (dni && !/^\d{8}$/.test(dni)) {
      throw new Error('profiles.errors.dni');
    }
    this._dni = dni;
  }

  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string {
    return this._lastName;
  }
  get fullName(): string {
    return [this._firstName, this._lastName].filter(Boolean).join(' ');
  }

  updateName(firstName: string, lastName: string): void {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last || first.length > 100 || last.length > 100) {
      throw new Error('profiles.errors.name');
    }
    this._firstName = first;
    this._lastName = last;
  }

  get userId(): number {
    return this._userId;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  get email(): string {
    return this._email;
  }

  updatePhoneNumber(value: string): void {
    const phoneNumber = value.trim();
    if (phoneNumber.length > 15) {
      throw new Error('profiles.errors.phone');
    }
    this._phoneNumber = phoneNumber;
  }
}
