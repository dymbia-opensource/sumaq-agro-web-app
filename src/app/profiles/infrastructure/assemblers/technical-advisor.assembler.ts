import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { TechnicalAdvisor } from '../../domain/model/entities/technical-advisor.entity';
import {
  TechnicalAdvisorResource,
  TechnicalAdvisorsResponse,
} from '../responses/technical-advisor.response';

export class TechnicalAdvisorAssembler implements BaseAssembler<
  TechnicalAdvisor,
  TechnicalAdvisorResource,
  TechnicalAdvisorsResponse
> {
  toEntityFromResource(resource: TechnicalAdvisorResource): TechnicalAdvisor {
    return new TechnicalAdvisor({
      id: resource.id,
      cooperativeId: resource.cooperativeId,
      userId: resource.userId,
      name: resource.name,
      cipCode: resource.cipCode,
      phone: resource.phone,
      assignedPlotsCount: resource.assignedPlotsCount ?? 0,
    });
  }

  toResourceFromEntity(entity: TechnicalAdvisor): TechnicalAdvisorResource {
    return {
      id: entity.id as number,
      cooperativeId: entity.cooperativeId,
      userId: entity.userId,
      name: entity.name,
      cipCode: entity.cipCode,
      phone: entity.phone,
      assignedPlotsCount: entity.assignedPlotsCount,
    };
  }

  toEntitiesFromResponse(response: TechnicalAdvisorsResponse): TechnicalAdvisor[] {
    return response.agronomists
      ? response.agronomists.map((advisor) => this.toEntityFromResource(advisor))
      : [];
  }
}
