import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { ExtractRepresentativeSampleCommand } from '../domain/model/commands/extract-representative-sample.command';
import { GradePotatoCalibersCommand } from '../domain/model/commands/grade-potato-calibers.command';
import { IssueQualityCertificateCommand } from '../domain/model/commands/issue-quality-certificate.command';
import { PerformCoffeeCuppingCommand } from '../domain/model/commands/perform-coffee-cupping.command';
import { RegisterHarvestBatchCommand } from '../domain/model/commands/register-harvest-batch.command';
import { RevokeQualityCertificateCommand } from '../domain/model/commands/revoke-quality-certificate.command';
import { VerifyCertificateCommand } from '../domain/model/commands/verify-certificate.command';
import { WeighDeliveredBatchCommand } from '../domain/model/commands/weigh-delivered-batch.command';
import { HarvestBatchesApiEndpoint } from './endpoints/harvest-batches.endpoint';
import { PublicTraceabilityApiEndpoint } from './endpoints/public-traceability.endpoint';
import { QualityCertificatesApiEndpoint } from './endpoints/quality-certificates.endpoint';

/**
 * Infrastructure facade of Harvest Certification: batches, certificates and
 * their public verification.
 */
@Injectable({ providedIn: 'root' })
export class CertificationApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly batches = new HarvestBatchesApiEndpoint(this.http);
  private readonly certificates = new QualityCertificatesApiEndpoint(this.http);
  private readonly traceability = new PublicTraceabilityApiEndpoint(this.http);

  getBatchesByCooperative = (cooperativeId: number) => this.batches.getByCooperative(cooperativeId);
  getBatch = (batchId: number) => this.batches.getById(batchId);
  registerBatch = (command: RegisterHarvestBatchCommand) => this.batches.register(command);
  weighBatch = (command: WeighDeliveredBatchCommand) => this.batches.weigh(command);
  extractSample = (command: ExtractRepresentativeSampleCommand) =>
    this.batches.extractSample(command);
  gradePotato = (command: GradePotatoCalibersCommand) => this.batches.gradePotato(command);
  cupCoffee = (command: PerformCoffeeCuppingCommand) => this.batches.cupCoffee(command);

  issueCertificate = (command: IssueQualityCertificateCommand) => this.certificates.issue(command);
  getCertificateByNumber = (certificateNumber: string) =>
    this.certificates.getByNumber(certificateNumber);
  revokeCertificate = (command: RevokeQualityCertificateCommand) =>
    this.certificates.revoke(command);
  getCertificateDocument = (certificateId: number) => this.certificates.document(certificateId);

  verifyCertificate = (command: VerifyCertificateCommand) => this.traceability.verify(command);
}
