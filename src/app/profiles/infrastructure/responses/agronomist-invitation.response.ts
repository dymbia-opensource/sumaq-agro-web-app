import { InvitationStatus } from '../../domain/model/entities/agronomist-invitation.entity';

/** Invitation of an agronomist, as the platform returns it. */
export interface AgronomistInvitationResource {
  id: number;
  cooperativeId: number;
  email: string;
  status: InvitationStatus;
  sentAt: string;
  agronomistUserId: number | null;
}
