import { UserRole } from '../domain/model/value-objects/user-role';

/** Published identity projection; excludes credentials and authentication operations. */
export interface SessionParticipant {
  readonly id: number;
  readonly displayName: string;
  readonly experience: UserRole;
  readonly initialRoute: string;
}
