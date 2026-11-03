import { inject, Injectable, Signal } from '@angular/core';
import { IamStore } from './iam.store';
import { SessionParticipant } from './session-participant';

/** Read-only session contract; authentication state and operations remain in IAM. */
@Injectable({ providedIn: 'root' })
export class SessionContext {
  readonly activeUser: Signal<SessionParticipant | null> = inject(IamStore).activeUser;
}
