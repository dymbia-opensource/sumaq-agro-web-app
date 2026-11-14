import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { CooperativeMember } from '../../domain/model/entities/cooperative-member.entity';
import {
  CooperativeMemberResource,
  CooperativeMembersResponse,
} from '../responses/cooperative-member.response';

/** Converts cooperative member resources to their dashboard read model. */
export class CooperativeMemberAssembler implements BaseAssembler<
  CooperativeMember,
  CooperativeMemberResource,
  CooperativeMembersResponse
> {
  toEntityFromResource(resource: CooperativeMemberResource): CooperativeMember {
    return new CooperativeMember(resource);
  }

  toResourceFromEntity(entity: CooperativeMember): CooperativeMemberResource {
    return {
      id: entity.id as number,
      cooperativeId: entity.cooperativeId,
      fullName: entity.fullName,
      active: entity.active,
      dni: entity.dni,
      phone: entity.phone,
      community: entity.community,
      userId: entity.userId,
      plots: entity.plots,
    };
  }

  toEntitiesFromResponse(response: CooperativeMembersResponse): CooperativeMember[] {
    return response.members.map((member) => this.toEntityFromResource(member));
  }
}
