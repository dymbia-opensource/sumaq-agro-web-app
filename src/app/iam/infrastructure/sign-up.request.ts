/**
 * Resource payload sent to the sign-up endpoint (`POST /users`).
 */
export interface SignUpRequest {
  /** Email of the new account. */
  email: string;
  /** Raw password of the new account (8 to 72 characters). */
  password: string;
  /** Single role of the account, for example `ROLE_FARMER`. */
  roles: string[];
  /** Names used to create the profile of the account. */
  profile: {
    firstName: string;
    lastName: string;
  };
}
