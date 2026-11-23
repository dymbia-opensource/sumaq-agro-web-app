/** Quality certificate as the platform returns it (`/quality-certificates`). */
export interface QualityCertificateResource {
  id: number;
  certificateNumber: string;
  harvestBatchId: number;
  qualityCategory: string;
  certificateHash: string;
  issuedByUserId: number;
  issuedAt: string;
  /** `ACTIVE` or `REVOKED`. */
  status: string;
}
