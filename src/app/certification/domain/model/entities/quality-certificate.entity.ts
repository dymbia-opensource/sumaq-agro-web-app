import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { CertificateStatus } from './certificate-status';

/** Identidad, huella y token público del certificado emitido para un lote. */
export interface QualityCertificateProps {
  id: number;
  harvestBatchId: number;
  certificateNumber: string;
  sha256Hash: string;
  verificationToken: string;
  issuedByUserId: number;
  issuedByName: string;
  issuedAt: string;
  status: CertificateStatus;
  revokedReason: string | null;
}

/** Representa el certificado y su estado vigente o revocado. */
export class QualityCertificate extends BaseEntity {
  constructor(readonly data: QualityCertificateProps) {
    super({ id: data.id });
  }
}
