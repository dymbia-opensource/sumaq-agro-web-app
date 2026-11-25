import { AgronomistInvitation } from '../../domain/model/entities/agronomist-invitation.entity';
import { AgronomistInvitationResource } from '../responses/agronomist-invitation.response';

export class AgronomistInvitationAssembler {
  toEntityFromResource(resource: AgronomistInvitationResource): AgronomistInvitation {
    return new AgronomistInvitation({
      id: resource.id,
      email: resource.email,
      status: resource.status,
      sentAt: new Date(resource.sentAt),
      agronomistUserId: resource.agronomistUserId ?? null,
    });
  }
}
