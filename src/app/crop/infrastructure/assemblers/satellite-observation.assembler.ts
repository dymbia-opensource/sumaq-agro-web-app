import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { SatelliteObservation } from '../../domain/model/entities/satellite-observation.entity';
import {
  SatelliteObservationResource,
  SatelliteObservationsResponse,
} from '../responses/satellite-observation.response';

export class SatelliteObservationAssembler implements BaseAssembler<
  SatelliteObservation,
  SatelliteObservationResource,
  SatelliteObservationsResponse
> {
  toEntityFromResource(resource: SatelliteObservationResource): SatelliteObservation {
    return new SatelliteObservation({
      id: resource.id,
      plotId: resource.plotId,
      date: resource.capturedAt,
      source: resource.source,
      ndviMean: resource.ndviMean,
      ndwiMean: resource.ndwiMean,
      surfaceTempKelvin: resource.surfaceTempKelvin,
      cloudCoveragePercent: resource.cloudCoveragePercent,
    });
  }
  toResourceFromEntity(entity: SatelliteObservation): SatelliteObservationResource {
    return {
      id: entity.id as number,
      plotId: entity.plotId,
      capturedAt: entity.date,
      source: entity.source,
      ndviMean: entity.ndviMean,
      ndwiMean: entity.ndwiMean,
      surfaceTempKelvin: entity.surfaceTempKelvin,
      cloudCoveragePercent: entity.cloudCoveragePercent,
    };
  }
  toEntitiesFromResponse(response: SatelliteObservationsResponse): SatelliteObservation[] {
    return response.observations.map((r) => this.toEntityFromResource(r));
  }
}
