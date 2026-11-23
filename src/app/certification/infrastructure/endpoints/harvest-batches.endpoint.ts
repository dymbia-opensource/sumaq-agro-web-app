import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ExtractRepresentativeSampleCommand } from '../../domain/model/commands/extract-representative-sample.command';
import { GradePotatoCalibersCommand } from '../../domain/model/commands/grade-potato-calibers.command';
import { PerformCoffeeCuppingCommand } from '../../domain/model/commands/perform-coffee-cupping.command';
import { RegisterHarvestBatchCommand } from '../../domain/model/commands/register-harvest-batch.command';
import { WeighDeliveredBatchCommand } from '../../domain/model/commands/weigh-delivered-batch.command';
import { BatchEntry } from '../../domain/model/entities/batch-entry';
import { HarvestBatch } from '../../domain/model/entities/harvest-batch.entity';
import { HarvestBatchAssembler } from '../assemblers/harvest-batch.assembler';
import { BatchEntryResource, HarvestBatchResource } from '../responses/harvest-batch.response';

/**
 * HTTP endpoint for the harvest batches (`/harvest-batches`). Every command
 * answers with the batch as it is after the change.
 */
export class HarvestBatchesApiEndpoint {
  private readonly url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderHarvestBatchesEndpointPath}`;
  private readonly assembler = new HarvestBatchAssembler();

  constructor(private readonly http: HttpClient) {}

  /**
   * Loads the batches of a cooperative with their certificates.
   * @param cooperativeId - Cooperative of the batches.
   */
  getByCooperative(cooperativeId: number): Observable<BatchEntry[]> {
    return this.http
      .get<BatchEntryResource[]>(this.url, { params: { cooperativeId } })
      .pipe(map((entries) => entries.map(this.assembler.toEntryFromResource)));
  }

  getById(batchId: number): Observable<HarvestBatch> {
    return this.http
      .get<HarvestBatchResource>(`${this.url}/${batchId}`)
      .pipe(map(this.assembler.toEntityFromResource));
  }

  register(command: RegisterHarvestBatchCommand): Observable<HarvestBatch> {
    return this.http
      .post<HarvestBatchResource>(this.url, this.assembler.toRegisterRequestFromCommand(command))
      .pipe(map(this.assembler.toEntityFromResource));
  }

  weigh(command: WeighDeliveredBatchCommand): Observable<HarvestBatch> {
    return this.post(command.batchId, '/weight', this.assembler.toWeighRequestFromCommand(command));
  }

  extractSample(command: ExtractRepresentativeSampleCommand): Observable<HarvestBatch> {
    return this.post(command.batchId, '/sample', this.assembler.toSampleRequestFromCommand(command));
  }

  gradePotato(command: GradePotatoCalibersCommand): Observable<HarvestBatch> {
    return this.post(
      command.batchId,
      '/potato-calibers',
      this.assembler.toPotatoRequestFromCommand(command),
    );
  }

  cupCoffee(command: PerformCoffeeCuppingCommand): Observable<HarvestBatch> {
    return this.post(
      command.batchId,
      '/coffee-cupping',
      this.assembler.toCoffeeRequestFromCommand(command),
    );
  }

  private post(batchId: number, path: string, body: object): Observable<HarvestBatch> {
    return this.http
      .post<HarvestBatchResource>(`${this.url}/${batchId}${path}`, body)
      .pipe(map(this.assembler.toEntityFromResource));
  }
}
