/**
 * Resource payload sent to request a recovery email
 * (`POST /authentication/password-recovery/request`).
 */
export interface PasswordRecoveryRequest {
  /** Email of the account to recover. */
  email: string;
}

/**
 * Resource payload sent to choose a new password
 * (`POST /authentication/password-recovery/reset`).
 */
export interface PasswordResetRequest {
  /** Token received in the recovery email. */
  token: string;
  /** New raw password. */
  newPassword: string;
}
