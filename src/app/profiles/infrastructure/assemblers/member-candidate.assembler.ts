import { MemberCandidate } from '../../domain/model/entities/member-candidate';
import { MemberCandidateResource } from '../responses/member-candidate.response';

export class MemberCandidateAssembler {
  toEntityFromResource(resource: MemberCandidateResource): MemberCandidate {
    return {
      userId: resource.userId,
      email: resource.email,
      firstName: resource.firstName ?? '',
      lastName: resource.lastName ?? '',
      dni: resource.dni ?? '',
      phoneNumber: resource.phoneNumber ?? '',
      alreadyMember: resource.alreadyMember,
    };
  }
}
