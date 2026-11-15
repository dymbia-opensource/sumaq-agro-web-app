/** Profile returned by Spring, including the account email from IAM. */
export interface FarmerProfileResource {
  id: number;
  userId: number;
  firstName?: string;
  lastName?: string;
  phoneNumber: string | null;
  email: string | null;
}
