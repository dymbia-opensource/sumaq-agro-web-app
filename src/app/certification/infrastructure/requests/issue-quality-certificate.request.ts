/** Payload sent to issue a certificate (`POST /quality-certificates`). */
export interface IssueQualityCertificateRequest {
  certificateNumber: string;
  harvestBatchId: number;
  issuedByUserId: number;
}
