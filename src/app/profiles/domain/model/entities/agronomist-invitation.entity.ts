import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/** State of an invitation sent by a cooperative to an agronomist. */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

/**
 * Invitation of an agronomist to the technical team of a cooperative (US-19).
 *
 * @remarks
 * It is accepted when the agronomist signs up with the invited email, or at once
 * when he already had an account. The accepted invitations are the technical team.
 */
export class AgronomistInvitation extends BaseEntity {
  readonly email: string;
  readonly status: InvitationStatus;
  readonly sentAt: Date;
  /** Account of the agronomist who accepted it; null while it is pending. */
  readonly agronomistUserId: number | null;

  constructor(props: {
    id: number;
    email: string;
    status: InvitationStatus;
    sentAt: Date;
    agronomistUserId: number | null;
  }) {
    super({ id: props.id });
    this.email = props.email;
    this.status = props.status;
    this.sentAt = props.sentAt;
    this.agronomistUserId = props.agronomistUserId;
  }

  /** Whether the agronomist already belongs to the technical team. */
  get accepted(): boolean {
    return this.status === 'ACCEPTED' && this.agronomistUserId !== null;
  }
}
