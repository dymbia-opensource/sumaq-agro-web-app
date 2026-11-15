import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { HarvestBatch } from './harvest-batch.entity';
import { QualityCertificate } from './quality-certificate.entity';

/** Modelo de lectura que reúne el certificado y su lote para la consulta pública. */
export class PublicTraceabilityRecord extends BaseEntity {
  constructor(
    readonly certificate: QualityCertificate,
    readonly batch: HarvestBatch,
  ) {
    super({ id: certificate.id });
  }

  /** La consulta es vigente cuando el certificado está activo y apunta a este lote. */
  get isActive(): boolean {
    return (
      this.certificate.data.status === 'ACTIVE' &&
      this.batch.id === this.certificate.data.harvestBatchId
    );
  }
}
