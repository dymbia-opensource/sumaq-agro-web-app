/**
 * Provisional response returned after successful authentication.
 */
export interface SignInResponse {
  readonly id: number | string;
  readonly email: string;
  readonly fullName?: string | null;
  readonly roles: readonly string[];
  readonly token: string;
}
