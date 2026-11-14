import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CooperativeMember } from '../../profiles/domain/model/entities/cooperative-member.entity';
import { IssueQualityCertificateCommand } from '../domain/model/commands/issue-quality-certificate.command';
import { RegisterHarvestBatchCommand } from '../domain/model/commands/register-harvest-batch.command';
import { HarvestBatch, HarvestBatchProps } from '../domain/model/entities/harvest-batch.entity';
import { PublicTraceabilityRecord } from '../domain/model/entities/public-traceability-record.entity';
import { QualityCertificate } from '../domain/model/entities/quality-certificate.entity';
import { HarvestBatchesApiEndpoint } from './endpoints/harvest-batches.endpoint';
import { PublicTraceabilityApiEndpoint } from './endpoints/public-traceability.endpoint';
import { QualityCertificatesApiEndpoint } from './endpoints/quality-certificates.endpoint';

/** Member and source plots offered by the collection form. */
export type CooperativeMemberOption = CooperativeMember;

/** Facade for harvest batches, certificates and public traceability. */
@Injectable({ providedIn: 'root' })
export class CertificationApi {
  private readonly http = inject(HttpClient);
  private readonly batches = new HarvestBatchesApiEndpoint(this.http);
  private readonly certificates = new QualityCertificatesApiEndpoint(this.http);
  private readonly traceability = new PublicTraceabilityApiEndpoint(this.http);

  getBatches(cooperativeId: number): Observable<HarvestBatch[]> {
    return this.batches.getByCooperative(cooperativeId);
  }

  createBatch(batch: RegisterHarvestBatchCommand): Observable<HarvestBatch> {
    return this.batches.register(batch);
  }

  updateBatch(batch: HarvestBatchProps): Observable<HarvestBatch> {
    return this.batches.update(new HarvestBatch(batch), batch.id);
  }

  getCertificates(): Observable<QualityCertificate[]> {
    return this.certificates.getAll();
  }

  createCertificate(certificate: IssueQualityCertificateCommand): Observable<QualityCertificate> {
    return this.certificates.issue(certificate);
  }

  verifyCertificate(token: string): Observable<QualityCertificate | null> {
    return this.certificates.getByToken(token);
  }

  getBatch(id: number): Observable<HarvestBatch> {
    return this.batches.getById(id);
  }

  /** Consulta el registro público por token; el endpoint une lote y certificado. */
  getPublicTraceability(token: string): Observable<PublicTraceabilityRecord | null> {
    return this.traceability.getByToken(token);
  }
}
