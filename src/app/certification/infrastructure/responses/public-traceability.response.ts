/** Public verification of a certificate (`GET /public/traceability?number=&hash=`). */
export interface PublicTraceabilityResource {
  certificateNumber: string;
  /** `ACTIVE` or `REVOKED`. */
  status: string;
  authentic: boolean;
  batchCode: string | null;
  cropType: string | null;
  qualityCategory: string | null;
  qualityScore: number | null;
  plotName: string | null;
  region: string | null;
  seedVariety: string | null;
}
