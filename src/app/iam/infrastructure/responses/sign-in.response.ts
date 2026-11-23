import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/**
 * Resource returned by the sign-in endpoint: the authenticated user and its access token.
 */
export interface SignInResource extends BaseResource {
  id: number;
  email: string;
  roles: string[];
  token: string;
  fullName: string | null;
}

/**
 * Response shape returned by the sign-in endpoint.
 */
export interface SignInResponse extends BaseResponse, SignInResource {}
