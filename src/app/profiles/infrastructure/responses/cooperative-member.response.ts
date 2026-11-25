import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';
import { MemberPlot } from '../../domain/model/entities/cooperative-member.entity';

/** API representation of a cooperative member. */
export interface CooperativeMemberResource extends BaseResource {
  id: number;
  cooperativeId: number;
  fullName: string;
  active: boolean;
  dni?: string;
  phone?: string;
  community?: string;
  /** Account reference, independent of the membership identifier. */
  userId?: number | null;
  /** Canonical plot references available to the member. */
  plots?: MemberPlot[];
}

export interface CooperativeMemberDetails {
  firstName: string;
  lastName: string;
  dni: string;
  community: string;
  /** Email of the producer account of the member, when he has one. */
  email?: string;
}

/** API response used by the production service when it wraps members. */
export interface CooperativeMembersResponse extends BaseResponse {
  members: CooperativeMemberResource[];
}
