/** Provisional payload for consuming a password recovery token. */
export interface ResetPasswordRequest {
  readonly token: string;
  readonly newPassword: string;
}
