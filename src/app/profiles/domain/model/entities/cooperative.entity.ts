import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Institutional profile of a cooperative managed by a cooperative director.
 *
 * The cooperative is the aggregate root of the institutional information
 * managed by Profiles. Agricultural plots and campaigns remain in Field
 * Management and are only referenced by their identifiers in later features.
 */
export class Cooperative extends BaseEntity {
  private readonly _directorUserId: number;
  private _legalName: string;
  private _region: string;
  private _institutionalEmail: string;
  private _legalRepresentative: string;
  private _ruc: string;
  private _headquartersAddress: string;
  private _switchboardPhone: string;

  constructor(props: {
    id: number;
    directorUserId: number;
    legalName: string;
    region: string;
    institutionalEmail: string;
    legalRepresentative: string;
    ruc: string;
    headquartersAddress: string;
    switchboardPhone: string;
  }) {
    super({ id: props.id });
    this._directorUserId = props.directorUserId;
    this._legalName = props.legalName;
    this._region = props.region;
    this._institutionalEmail = props.institutionalEmail;
    this._legalRepresentative = props.legalRepresentative;
    this._ruc = props.ruc;
    this._headquartersAddress = props.headquartersAddress;
    this._switchboardPhone = props.switchboardPhone;
  }

  get directorUserId(): number {
    return this._directorUserId;
  }
  get legalName(): string {
    return this._legalName;
  }
  get region(): string {
    return this._region;
  }
  get institutionalEmail(): string {
    return this._institutionalEmail;
  }
  get legalRepresentative(): string {
    return this._legalRepresentative;
  }
  get ruc(): string {
    return this._ruc;
  }
  get headquartersAddress(): string {
    return this._headquartersAddress;
  }
  get switchboardPhone(): string {
    return this._switchboardPhone;
  }

  /** Updates the legal and contact information managed by the director. */
  updateInstitutionalData(data: {
    legalName: string;
    region: string;
    institutionalEmail: string;
    legalRepresentative: string;
    ruc: string;
    headquartersAddress: string;
    switchboardPhone: string;
  }): void {
    const values = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value.trim()]),
    ) as typeof data;

    if (Object.values(values).some((value) => !value)) {
      throw new Error('All institutional data is required.');
    }
    if (!/^\d{11}$/.test(values.ruc)) {
      throw new Error('The RUC must have eleven digits.');
    }
    if (!/^\S+@\S+\.\S+$/.test(values.institutionalEmail)) {
      throw new Error('The institutional email is invalid.');
    }

    this._legalName = values.legalName;
    this._region = values.region;
    this._institutionalEmail = values.institutionalEmail.toLowerCase();
    this._legalRepresentative = values.legalRepresentative;
    this._ruc = values.ruc;
    this._headquartersAddress = values.headquartersAddress;
    this._switchboardPhone = values.switchboardPhone;
  }
}
