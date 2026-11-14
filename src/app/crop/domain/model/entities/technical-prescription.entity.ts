import { requireId, requireText, requireDate } from '../validation';
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Properties required to instantiate a {@link TechnicalPrescription}.
 */
export interface TechnicalPrescriptionProps {
  id?: number | string;
  reportId: number;
  agronomistId: number;
  recommendedProducts: string;
  dosageInstructions: string;
  applicationDate: string;
}

/**
 * Domain entity representing an agronomist's technical prescription
 * to treat a reported pest or disease.
 */
export class TechnicalPrescription extends BaseEntity {
  private _reportId: number;
  private _agronomistId: number;
  private _recommendedProducts: string;
  private _dosageInstructions: string;
  private _applicationDate: string;

  /**
   * Initializes a new instance of the {@link TechnicalPrescription} class.
   *
   * @param props - Technical prescription properties.
   */
  constructor(props: TechnicalPrescriptionProps) {
    super({ id: props.id ?? 0 });
    requireId(props.reportId);
    requireId(props.agronomistId);
    requireText(props.recommendedProducts);
    requireText(props.dosageInstructions);
    requireDate(props.applicationDate);
    this._reportId = props.reportId;
    this._agronomistId = props.agronomistId;
    this._recommendedProducts = props.recommendedProducts;
    this._dosageInstructions = props.dosageInstructions;
    this._applicationDate = props.applicationDate;
  }

  /** Gets the associated pest report identifier. */
  get reportId(): number {
    return this._reportId;
  }

  /** Gets the identifier of the agronomist writing the prescription. */
  get agronomistId(): number {
    return this._agronomistId;
  }

  /** Gets the list or names of the recommended agrochemical or organic products. */
  get recommendedProducts(): string {
    return this._recommendedProducts;
  }

  /** Gets the specific dosage and safety instructions. */
  get dosageInstructions(): string {
    return this._dosageInstructions;
  }

  /** Gets the target date when the treatment should be applied. */
  get applicationDate(): string {
    return this._applicationDate;
  }
}
