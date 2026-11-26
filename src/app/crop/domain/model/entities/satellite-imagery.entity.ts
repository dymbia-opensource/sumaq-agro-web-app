import { SatelliteIndex } from "../valueobjects/satellite-index";
import { requireDate, requireId } from "../validation";

/** Available raster layers belonging to exactly one persisted observation. */
export class SatelliteImagery {
  readonly observationId: number;
  readonly plotId: number;
  readonly capturedAt: string;
  readonly source: string;
  readonly availableIndices: readonly SatelliteIndex[];

  constructor(props: {
    observationId: number;
    plotId: number;
    capturedAt: string;
    source: string;
    availableIndices: readonly SatelliteIndex[];
  }) {
    requireId(props.observationId);
    requireId(props.plotId);
    requireDate(props.capturedAt);
    if (
      !props.source?.trim() ||
      !Array.isArray(props.availableIndices) ||
      props.availableIndices.some((index) => !["NDVI", "NDWI"].includes(index))
    )
      throw new Error("crop.errors.invalid-data");
    this.observationId = props.observationId;
    this.plotId = props.plotId;
    this.capturedAt = props.capturedAt;
    this.source = props.source;
    this.availableIndices = [...new Set(props.availableIndices)];
  }
}
