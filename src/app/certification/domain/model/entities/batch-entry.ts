import { HarvestBatch } from './harvest-batch.entity';
import { QualityCertificate } from './quality-certificate.entity';

/**
 * Read model of the certification workspace: one batch with its certificate,
 * when it has one.
 */
export interface BatchEntry {
  readonly batch: HarvestBatch;
  readonly certificate: QualityCertificate | null;
}
