import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { AgroclimaticAlert } from '../../domain/model/entities/agroclimatic-alert.entity';
import {
  AgroclimaticAlertResource,
  AgroclimaticAlertsResponse,
} from '../responses/agroclimatic-alert.response';

export class AgroclimaticAlertAssembler implements BaseAssembler<
  AgroclimaticAlert,
  AgroclimaticAlertResource,
  AgroclimaticAlertsResponse
> {
  toEntityFromResource(resource: AgroclimaticAlertResource): AgroclimaticAlert {
    return new AgroclimaticAlert({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      severity: resource.severity,
      region: resource.region,
      issuedAt: resource.issuedAt,
      source: resource.source,
    });
  }
  toResourceFromEntity(entity: AgroclimaticAlert): AgroclimaticAlertResource {
    return {
      id: entity.id as number,
      title: entity.title,
      description: entity.description,
      severity: entity.severity,
      region: entity.region,
      issuedAt: entity.issuedAt,
      source: entity.source,
    };
  }
  toEntitiesFromResponse(response: AgroclimaticAlertsResponse): AgroclimaticAlert[] {
    return response.alerts.map((r) => this.toEntityFromResource(r));
  }
}
