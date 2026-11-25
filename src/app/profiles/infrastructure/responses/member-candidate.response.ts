/** Producer account found by email, as the platform returns it. */
export interface MemberCandidateResource {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  phoneNumber: string | null;
  alreadyMember: boolean;
}
