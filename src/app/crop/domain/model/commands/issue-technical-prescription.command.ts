/** Prescription fields provided by the agronomist. */
export class IssueTechnicalPrescriptionCommand {
  readonly reportId: number;
  readonly agronomistId: number;
  readonly product: string;
  readonly dosage: string;
  readonly instructions: string;
  readonly applicationDate: string;

  constructor(fields: {
    reportId: number;
    agronomistId: number;
    product: string;
    dosage: string;
    instructions: string;
    applicationDate: string;
  }) {
    this.reportId = fields.reportId;
    this.agronomistId = fields.agronomistId;
    this.product = fields.product;
    this.dosage = fields.dosage;
    this.instructions = fields.instructions;
    this.applicationDate = fields.applicationDate;
  }
}
