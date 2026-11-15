import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/** API representation of a cooperative. */
export interface CooperativeResource extends BaseResource {
  id: number;
  managerUserId: number;
  businessName: string;
  region: string;
  institutionalEmail: string | null;
  legalRepresentative: string | null;
  ruc: string;
  headquartersAddress: string | null;
  switchboardPhone: string | null;
}

/** API response used by the production service when it wraps cooperatives. */
export interface CooperativesResponse extends BaseResponse {
  cooperatives: CooperativeResource[];
}
