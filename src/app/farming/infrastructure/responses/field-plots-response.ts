import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/**
 * Resource representation of the initial soil analysis of a plot.
 *
 * @remarks
 * The RESTful API stores it in the `soil_*` columns of `field_plots`.
 */
export interface SoilBaselineResource {
  /** pH of the soil, between 0 and 14. */
  ph: number;
  /** Texture (`SANDY`, `LOAMY`, `CLAY`, `SILTY`, `SANDY_LOAM` or `CLAY_LOAM`). */
  texture: string;
  /** Organic matter, from 0 to 100 %. */
  organicMatterPercentage: number;
  /** Date of the analysis in `YYYY-MM-DD` format. */
  recordedAt: string;
}

/**
 * One vertex of the plot polygon, as the API names it.
 *
 * @remarks
 * The platform sends named fields instead of a pair of numbers, so no caller
 * has to remember which one comes first. The order only matters inside the
 * anticorruption layer that talks to AgroMonitoring, which expects GeoJSON
 * (`[longitude, latitude]`), and that conversion belongs to the platform.
 */
export interface GeoCoordinateResource {
  latitude: number;
  longitude: number;
}

/**
 * Resource representation of a field plot.
 */
export interface FieldPlotResource extends BaseResource {
  /** Unique identifier of the plot. */
  id: number;
  /** Producer who owns the plot. */
  ownerUserId: number;
  /** Name of the plot. */
  name: string;
  /** Region or valley of the plot. */
  region: string;
  /** Monitoring status (`WITHOUT_POLYGON` or `ACTIVE_MONITORING`). */
  status: string;
  /** Polygon vertices as `[latitude, longitude]` pairs. */
  boundary: GeoCoordinateResource[];
  /** Area of the plot, in hectares. */
  areaHectares: number;
  /** Polygon identifier in AgroMonitoring, or an empty text. */
  agroMonitoringPolygonId: string;
  /** Initial soil analysis, or `null` if it was not recorded. */
  soilBaseline?: SoilBaselineResource | null;
}

/**
 * Response envelope for field plot collection queries.
 */
export interface FieldPlotsResponse extends BaseResponse {
  /** Field plot resources included in the response. */
  plots: FieldPlotResource[];
}
