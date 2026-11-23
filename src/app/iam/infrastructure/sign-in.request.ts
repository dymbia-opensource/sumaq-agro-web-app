/**
 * Resource payload sent to the sign-in endpoint (`POST /tokens`).
 */
export interface SignInRequest {
  /** Email used to authenticate the account. */
  email: string;
  /** Raw password value for the sign-in request. */
  password: string;
}
