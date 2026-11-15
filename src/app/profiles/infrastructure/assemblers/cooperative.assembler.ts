import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Cooperative } from '../../domain/model/entities/cooperative.entity';
import { CooperativeResource, CooperativesResponse } from '../responses/cooperative.response';

/** Converts the Cooperative API contract to the domain entity and back. */
export class CooperativeAssembler implements BaseAssembler<
  Cooperative,
  CooperativeResource,
  CooperativesResponse
> {
  toEntityFromResource(resource: CooperativeResource): Cooperative {
    return new Cooperative({
      ...resource,
      directorUserId: resource.managerUserId,
      legalName: resource.businessName,
      institutionalEmail: resource.institutionalEmail ?? '',
      legalRepresentative: resource.legalRepresentative ?? '',
      headquartersAddress: resource.headquartersAddress ?? '',
      switchboardPhone: resource.switchboardPhone ?? '',
    });
  }

  toResourceFromEntity(entity: Cooperative): CooperativeResource {
    return {
      id: entity.id as number,
      managerUserId: entity.directorUserId,
      businessName: entity.legalName,
      region: entity.region,
      institutionalEmail: entity.institutionalEmail,
      legalRepresentative: entity.legalRepresentative,
      ruc: entity.ruc,
      headquartersAddress: entity.headquartersAddress,
      switchboardPhone: entity.switchboardPhone,
    };
  }

  toEntitiesFromResponse(response: CooperativesResponse): Cooperative[] {
    return response.cooperatives.map((cooperative) => this.toEntityFromResource(cooperative));
  }
}
