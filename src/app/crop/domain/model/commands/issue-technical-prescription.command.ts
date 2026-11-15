/**
 * Command to issue a technical treatment prescription for a pest report.
 */
export class IssueTechnicalPrescriptionCommand {
  /** Target pest report identifier. */
  readonly reportId: number;
  /** Agronomist issuing the prescription. */
  readonly agronomistId: number;
  /** Recommended products to apply. */
  readonly recommendedProducts: string;
  /** Dosage and handling instructions. */
  readonly dosageInstructions: string;
  /** Suggested application date. */
  readonly applicationDate: string;

  /**
   * Initializes a new instance of {@link IssueTechnicalPrescriptionCommand}.
   *
   * @param props - Command payload.
   */
  constructor(props: {
    reportId: number;
    agronomistId: number;
    recommendedProducts: string;
    dosageInstructions: string;
    applicationDate: string;
  }) {
    this.reportId = props.reportId;
    this.agronomistId = props.agronomistId;
    this.recommendedProducts = props.recommendedProducts;
    this.dosageInstructions = props.dosageInstructions;
    this.applicationDate = props.applicationDate;
  }
}
