import { SatelliteImagery } from "../../domain/model/entities/satellite-imagery.entity";
import { SatelliteImageryResource } from "../responses/satellite-imagery.response";

export class SatelliteImageryAssembler {
  toEntityFromResource(resource: SatelliteImageryResource): SatelliteImagery {
    return new SatelliteImagery(resource);
  }
}
