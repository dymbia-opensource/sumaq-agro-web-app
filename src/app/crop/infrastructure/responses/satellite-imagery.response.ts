import { SatelliteIndex } from "../../domain/model/valueobjects/satellite-index";

export interface SatelliteImageryResource {
  observationId: number;
  plotId: number;
  capturedAt: string;
  source: string;
  availableIndices: SatelliteIndex[];
}
