import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/**
 * Resource returned by the sign-up endpoint: the registered account.
 */
export interface SignUpResource extends BaseResource {
  id: number;
  email: string;
  roles: string[];
}

/**
 * Response shape returned by the sign-up endpoint.
 */
export interface SignUpResponse extends BaseResponse, SignUpResource {}
