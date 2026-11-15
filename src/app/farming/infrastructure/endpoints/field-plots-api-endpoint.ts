import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { toApiDate } from '../../../shared/infrastructure/api-date';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import {
  FieldPlot,
  GeoCoordinate,
  SoilBaseline,
} from '../../domain/model/entities/field-plot.entity';
import { FieldPlotAssembler } from '../assemblers/field-plot-assembler';
import {
  FieldPlotResource,
  FieldPlotsResponse,
  SoilBaselineResource,
} from '../responses/field-plots-response';

/** HTTP endpoint for the field plots resource (`/field-plots`). */
export class FieldPlotsApiEndpoint extends BaseApiEndpoint<
  FieldPlot,
  FieldPlotResource,
  FieldPlotsResponse,
  FieldPlotAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderFieldPlotsEndpointPath}`,
      new FieldPlotAssembler(),
    );
  }

  /**
   * Loads the plots of one producer.
   * @param ownerUserId - Producer who owns the plots.
   */
  getByOwner(ownerUserId: number): Observable<FieldPlot[]> {
    return this.getAllBy({ ownerUserId }, 'Failed to fetch the plots of the producer');
  }

  /**
   * Loads the plots with the given IDs; the ones that no longer exist are skipped.
   * @param ids - The IDs of the plots.
   */
  getByIds(ids: number[]): Observable<FieldPlot[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return of([]);
    return forkJoin(
      unique.map((id) =>
        this.http.get<FieldPlotResource>(this.endpointUrl + '/' + id).pipe(
          map(this.assembler.toEntityFromResource),
          catchError((error: HttpErrorResponse) =>
            error.status === 404 ? of(null) : throwError(() => error),
          ),
        ),
      ),
    ).pipe(map((plots) => plots.filter((plot) => plot !== null)));
  }

  override create(plot: FieldPlot): Observable<FieldPlot> {
    const { ownerUserId, name, region, areaHectares } = plot;
    return this.http
      .post<FieldPlotResource>(this.endpointUrl, {
        ownerUserId,
        name,
        region,
        areaHectares,
      })
      .pipe(map(this.assembler.toEntityFromResource));
  }

  savePolygon(id: number, points: readonly GeoCoordinate[]): Observable<FieldPlot> {
    const coordinates = points.map(({ latitude, longitude }) => ({ latitude, longitude }));
    return this.http
      .put<FieldPlotResource>(this.endpointUrl + '/' + id + '/polygon', {
        coordinates,
      })
      .pipe(map(this.assembler.toEntityFromResource));
  }

  saveSoilBaseline(id: number, soil: SoilBaseline): Observable<FieldPlot> {
    const body: SoilBaselineResource = {
      ph: soil.ph,
      texture: soil.texture,
      organicMatterPercentage: soil.organicMatterPercentage,
      recordedAt: toApiDate(soil.recordedAt),
    };
    return this.http
      .put<FieldPlotResource>(this.endpointUrl + '/' + id + '/soil-baseline', body)
      .pipe(map(this.assembler.toEntityFromResource));
  }
}
