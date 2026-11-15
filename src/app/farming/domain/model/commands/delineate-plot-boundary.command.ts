import { GeoCoordinate } from '../entities/field-plot.entity';

/**
 * Saves the GPS polygon of a plot.
 */
export class DelineatePlotBoundaryCommand {
  readonly plotId: number;
  /** Vertices of the polygon; at least three. */
  readonly coordinates: GeoCoordinate[];
  /** Area of the polygon, in hectares, calculated on the map. */
  readonly areaHectares: number;

  constructor(props: { plotId: number; coordinates: GeoCoordinate[]; areaHectares: number }) {
    this.plotId = props.plotId;
    this.coordinates = props.coordinates;
    this.areaHectares = props.areaHectares;
  }
}
