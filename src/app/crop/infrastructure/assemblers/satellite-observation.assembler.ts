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
      date: resource.date,
      ndviMean: resource.ndviMean,
      ndwiMean: resource.ndwiMean,
      surfaceTempKelvin: resource.surfaceTempKelvin,
      cloudCoveragePercent: resource.cloudCoveragePercent,
      stressAreaHectares: resource.stressAreaHectares,
      recommendation: resource.recommendation,
    });
  }
  toResourceFromEntity(entity: SatelliteObservation): SatelliteObservationResource {
    return {
      id: entity.id as number,
      plotId: entity.plotId,
      date: entity.date,
      ndviMean: entity.ndviMean,
      ndwiMean: entity.ndwiMean,
      surfaceTempKelvin: entity.surfaceTempKelvin,
      cloudCoveragePercent: entity.cloudCoveragePercent,
      stressAreaHectares: entity.stressAreaHectares,
      recommendation: entity.recommendation,
    };
  }
  toEntitiesFromResponse(response: SatelliteObservationsResponse): SatelliteObservation[] {
    return response.observations.map((r) => this.toEntityFromResource(r));
  }
}
