/**
 * Payload sent to the sign-in endpoint.
 */
export interface SignInRequest {
  readonly email: string;
  readonly password: string;
}
