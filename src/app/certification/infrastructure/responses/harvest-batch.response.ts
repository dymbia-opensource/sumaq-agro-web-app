import { QualityCertificateResource } from './quality-certificate.response';

/** Harvest batch as the platform returns it (`/harvest-batches`). */
export interface HarvestBatchResource {
  id: number;
  batchCode: string;
  cooperativeId: number;
  memberId: number;
  plotId: number;
  /** `ANDEAN_POTATO` or `SPECIALTY_COFFEE`. */
  cropType: string;
  /** Date in `YYYY-MM-DD` format. */
  harvestedOn: string;
  registeredAt: string;
  /** `PENDING`, `GRADED` or `CERTIFIED`. */
  status: string;
  netWeightKg: number | null;
  sampleIdentifier: string | null;
  sampleWeightKg: number | null;
  firstCaliberPercentage: number | null;
  secondCaliberPercentage: number | null;
  thirdCaliberPercentage: number | null;
  pestDamagePercentage: number | null;
  coffeeCuppingScore: number | null;
  coffeeFermentDefect: boolean;
  qualityScore: number | null;
  qualityCategory: string | null;
}

/** One row of `GET /harvest-batches?cooperativeId=`: a batch with its certificate. */
export interface BatchEntryResource {
  batch: HarvestBatchResource;
  certificate: QualityCertificateResource | null;
}
