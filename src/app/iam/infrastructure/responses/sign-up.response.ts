/**
 * Provisional response returned after registering an account.
 */
export interface SignUpResponse {
  readonly id: number | string;
  readonly email: string;
  readonly roles: readonly string[];
}
