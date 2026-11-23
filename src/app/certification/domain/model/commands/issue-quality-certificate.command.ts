/** Issues the quality certificate of a graded batch. */
export class IssueQualityCertificateCommand {
  readonly certificateNumber: string;
  readonly harvestBatchId: number;
  readonly issuedByUserId: number;

  constructor(props: { certificateNumber: string; harvestBatchId: number; issuedByUserId: number }) {
    const certificateNumber = props.certificateNumber.trim();
    if (!certificateNumber) throw new Error('certification.workspace.invalid');
    this.certificateNumber = certificateNumber;
    this.harvestBatchId = props.harvestBatchId;
    this.issuedByUserId = props.issuedByUserId;
  }
}
