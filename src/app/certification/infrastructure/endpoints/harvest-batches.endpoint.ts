import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { RegisterHarvestBatchCommand } from '../../domain/model/commands/register-harvest-batch.command';
import { HarvestBatch } from '../../domain/model/entities/harvest-batch.entity';
import { HarvestBatchAssembler } from '../assemblers/harvest-batch.assembler';
import { HarvestBatchResource } from '../responses/harvest-batch.response';
import { HarvestBatchesResponse } from '../responses/harvest-batches.response';

/** Acceso HTTP a los lotes registrados en la API. */
export class HarvestBatchesApiEndpoint extends BaseApiEndpoint<
  HarvestBatch,
  HarvestBatchResource,
  HarvestBatchesResponse,
  HarvestBatchAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderHarvestBatchesEndpointPath}`,
      new HarvestBatchAssembler(),
    );
  }

  /** Filtra los lotes por cooperativa y admite respuesta envuelta o arreglo. */
  getByCooperative(cooperativeId: number): Observable<HarvestBatch[]> {
    const params = new HttpParams().set('cooperativeId', cooperativeId);
    return this.http
      .get<HarvestBatchesResponse | HarvestBatchResource[]>(this.endpointUrl, { params })
      .pipe(map((response) => this.toEntities(response)));
  }

  /** Envía un lote nuevo; el servidor asigna el identificador. */
  register(command: RegisterHarvestBatchCommand): Observable<HarvestBatch> {
    return this.http
      .post<HarvestBatchResource>(this.endpointUrl, command)
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }
}
