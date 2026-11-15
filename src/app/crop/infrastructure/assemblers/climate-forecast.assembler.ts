import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { ClimateForecast } from '../../domain/model/entities/climate-forecast.entity';
import {
  ClimateForecastResource,
  ClimateForecastsResponse,
} from '../responses/climate-forecast.response';

export class ClimateForecastAssembler implements BaseAssembler<
  ClimateForecast,
  ClimateForecastResource,
  ClimateForecastsResponse
> {
  toEntityFromResource(resource: ClimateForecastResource): ClimateForecast {
    return new ClimateForecast({
      id: resource.id,
      region: resource.region,
      temperature: resource.temperature,
      rainChance: resource.rainChance,
      forecastDate: resource.forecastDate,
      source: resource.source,
    });
  }
  toResourceFromEntity(entity: ClimateForecast): ClimateForecastResource {
    return {
      id: entity.id as number,
      region: entity.region,
      temperature: entity.temperature,
      rainChance: entity.rainChance,
      forecastDate: entity.forecastDate,
      source: entity.source,
    };
  }
  toEntitiesFromResponse(response: ClimateForecastsResponse): ClimateForecast[] {
    return response.forecasts.map((r) => this.toEntityFromResource(r));
  }
}
