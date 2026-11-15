/**
 * Payload sent to the sign-up endpoint.
 */
export interface SignUpRequest {
  readonly email: string;
  readonly password: string;
  readonly roles: readonly string[];
  readonly profile:{
    readonly firstName:string;
    readonly lastName:string;
  };
}
