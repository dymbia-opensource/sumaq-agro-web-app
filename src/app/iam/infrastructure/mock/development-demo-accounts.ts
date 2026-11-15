import { environment } from '../../../../environments/environment';
import { UserRole } from '../../domain/model/entities/user-role';

export interface DevelopmentDemoAccount {
  readonly id: number;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
}

/** Public test credentials linked to the existing server/db.json identities. */
const accounts: readonly DevelopmentDemoAccount[] = [
  { id: 1, email: 'farmer@sumaqagro.test', password: 'SumaqAgroDemo2026!', role: 'FARMER' },
  {
    id: 3,
    email: 'cooperative@sumaqagro.test',
    password: 'SumaqAgroDemo2026!',
    role: 'COOPERATIVE_DIRECTOR',
  },
  { id: 4, email: 'agronomist@sumaqagro.test', password: 'SumaqAgroDemo2026!', role: 'AGRONOMIST' },
];

/** Both the login helper and simulated authentication are disabled outside development. */
export function getDevelopmentDemoAccounts(): readonly DevelopmentDemoAccount[] {
  return !environment.production && environment.useMockAuthentication ? accounts : [];
}
