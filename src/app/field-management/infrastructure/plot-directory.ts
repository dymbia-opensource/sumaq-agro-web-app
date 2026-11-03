import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { FieldManagementApi } from './field-management-api';
import { FieldPlot } from '../domain/model/entities/field-plot.entity';

/** Published plot data without aggregate mutations or campaign/cost details. */
export interface PlotSummary {
  readonly id: number;
  readonly ownerUserId: number;
  readonly name: string;
  readonly region: string;
  readonly areaHectares: number;
  readonly boundary: readonly { readonly latitude: number; readonly longitude: number }[];
  readonly hasPolygon: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlotDirectory {
  private readonly api = inject(FieldManagementApi);
  readonly changes = this.api.plotChanges;

  getByOwner(userId: number) {
    return this.api
      .getPlotsByOwner(userId)
      .pipe(map((plots) => plots.filter((plot) => plot.ownerUserId === userId).map(toSummary)));
  }

  getByIds(ids: number[]) {
    return this.api
      .getPlotsByIds(ids)
      .pipe(map((plots) => plots.filter((plot) => ids.includes(Number(plot.id))).map(toSummary)));
  }
}

function toSummary(plot: FieldPlot): PlotSummary {
  return Object.freeze({
    id: Number(plot.id),
    ownerUserId: plot.ownerUserId,
    name: plot.name,
    region: plot.region,
    areaHectares: plot.areaHectares,
    hasPolygon: plot.hasPolygon(),
    boundary: Object.freeze(
      plot.boundary.map((point) =>
        Object.freeze({
          latitude: point.latitude,
          longitude: point.longitude,
        }),
      ),
    ),
  });
}
