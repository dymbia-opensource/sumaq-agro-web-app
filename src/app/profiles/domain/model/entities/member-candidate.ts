/**
 * Producer account the director can add to the member list, read from its profile.
 *
 * @remarks
 * The names, DNI and phone come from the profile of the producer, so the director
 * does not type them again; the DNI and phone are empty when the producer did not add them.
 */
export interface MemberCandidate {
  readonly userId: number;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dni: string;
  readonly phoneNumber: string;
  /** Whether the producer is already a member of the cooperative. */
  readonly alreadyMember: boolean;
}
