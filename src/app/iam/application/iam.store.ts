import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { finalize, Subscription, Observable } from 'rxjs';
import { SignInCommand } from '../domain/model/commands/sign-in.command';
import { SignUpCommand } from '../domain/model/commands/sign-up.command';
import { AuthenticatedUser } from '../domain/model/entities/authenticated-user.entity';
import { IamApi } from '../infrastructure/iam-api';
import { SessionStorageService } from '../infrastructure/session/session-storage.service';
import { SessionExpirationService } from '../infrastructure/session/session-expiration.service';
import { RequestPasswordResetCommand } from '../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../domain/model/commands/reset-password.command';
import { UserRole } from '../domain/model/value-objects/user-role';

export type IamError =
  | 'INVALID_CREDENTIALS'
  | 'REGISTRATION_CONFLICT'
  | 'ACCESS_DENIED'
  | 'CONNECTION_ERROR'
  | 'UNEXPECTED_ERROR';

export type PasswordRecoveryError =
  'INVALID_LINK' | 'RATE_LIMITED' | 'CONNECTION_ERROR' | 'REQUEST_REJECTED' | 'UNEXPECTED_ERROR';

type IamOperation = 'sign-in' | 'sign-up';

export interface SessionParticipant {
  readonly id: number;
  readonly displayName: string;
  readonly experience: UserRole;
  readonly initialRoute: string;
}

const ROLE_PRIORITY: readonly UserRole[] = ['COOPERATIVE_DIRECTOR', 'AGRONOMIST', 'FARMER'];

const INITIAL_ROUTES: Record<UserRole, string> = {
  FARMER: '/dashboard',
  COOPERATIVE_DIRECTOR: '/cooperative/dashboard',
  AGRONOMIST: '/pest-reports',
};
/**
 * Holds IAM state and orchestrates authentication operations.
 */
@Service()
export class IamStore {
  private readonly iamApi = inject(IamApi);
  private readonly sessionStorage = inject(SessionStorageService);
  private readonly sessionExpiration = inject(SessionExpirationService);
  private readonly expiresAtSignal = signal<number | null>(null);
  private activeRequest?: Subscription;

  private readonly currentUserSignal = signal<AuthenticatedUser | null>(null);
  private readonly pendingOperationSignal = signal<IamOperation | null>(null);
  private readonly errorSignal = signal<IamError | null>(null);
  private readonly registrationCompletedSignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  /**
   * Public identity projection consumed by other bounded contexts.
   */
  readonly activeUser = computed<SessionParticipant | null>(() => {
    const user = this.currentUser();

    if (!user) return null;

    const experience = ROLE_PRIORITY.find((role) => user.hasRole(role));

    if (!experience) return null;

    const id =
      typeof user.id === 'number' ? user.id : /^[0-9]+$/.test(user.id) ? Number(user.id) : NaN;

    if (!Number.isSafeInteger(id) || id <= 0) return null;

    return {
      id,
      displayName: user.fullName,
      experience,
      initialRoute: INITIAL_ROUTES[experience],
    };
  });

  readonly hasActiveUser = computed(() => this.activeUser() !== null);
  readonly pendingOperation = this.pendingOperationSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly registrationCompleted = this.registrationCompletedSignal.asReadonly();
  readonly sessionExpiresAt = this.expiresAtSignal.asReadonly();

  readonly isSignedIn = computed(() => this.currentUser() !== null);
  readonly currentToken = computed(() => this.currentUser()?.token ?? null);
  readonly isLoading = computed(() => this.pendingOperation() !== null);

  private recoveryRequest?: Subscription;

  private readonly recoveryStateSignal = signal<'idle' | 'pending' | 'completed'>('idle');

  private readonly recoveryErrorSignal = signal<PasswordRecoveryError | null>(null);

  readonly isPasswordRecoveryPreview = this.iamApi.isPasswordRecoveryPreview;

  readonly passwordRecoveryLoading = computed(() => this.recoveryStateSignal() === 'pending');

  readonly passwordRecoveryCompleted = computed(() => this.recoveryStateSignal() === 'completed');

  readonly passwordRecoveryError = this.recoveryErrorSignal.asReadonly();

  constructor() {
    const restored = this.sessionStorage.restore();

    if (restored) {
      this.currentUserSignal.set(restored.user);
      this.expiresAtSignal.set(restored.expiresAt);

      this.sessionExpiration.start(restored.expiresAt, () => this.signOut());
    }

    inject(DestroyRef).onDestroy(() => {
      this.activeRequest?.unsubscribe();
      this.recoveryRequest?.unsubscribe();
      this.sessionExpiration.stop();
    });
  }

  signIn(command: SignInCommand): void {
    if (this.isLoading()) return;

    this.signOut();
    this.pendingOperationSignal.set('sign-in');

    this.activeRequest = this.iamApi
      .signIn(command)
      .pipe(finalize(() => this.pendingOperationSignal.set(null)))
      .subscribe({
        next: (user) => {
          const session = this.sessionStorage.save(user);
          const expiresAt = session?.expiresAt ?? null;

          this.expiresAtSignal.set(expiresAt);
          this.currentUserSignal.set(user);

          this.sessionExpiration.start(expiresAt, () => this.signOut());
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.resolveError(error, 'sign-in'));
        },
      });
  }

  signUp(command: SignUpCommand): void {
    if (this.isLoading()) return;

    this.errorSignal.set(null);
    this.registrationCompletedSignal.set(false);
    this.pendingOperationSignal.set('sign-up');

    this.activeRequest = this.iamApi
      .signUp(command)
      .pipe(finalize(() => this.pendingOperationSignal.set(null)))
      .subscribe({
        next: () => {
          this.registrationCompletedSignal.set(true);
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.resolveError(error, 'sign-up'));
        },
      });
  }

  signOut(): void {
    this.activeRequest?.unsubscribe();
    this.activeRequest = undefined;
    this.sessionExpiration.stop();
    this.expiresAtSignal.set(null);
    this.sessionStorage.clear();
    this.pendingOperationSignal.set(null);
    this.currentUserSignal.set(null);
    this.errorSignal.set(null);
    this.registrationCompletedSignal.set(false);
  }

  checkSessionExpiration(): void {
    this.sessionExpiration.check();
  }

  clearFeedback(): void {
    this.errorSignal.set(null);
    this.registrationCompletedSignal.set(false);
  }

  private resolveError(error: unknown, operation: IamOperation): IamError {
    if (!(error instanceof HttpErrorResponse)) {
      return 'UNEXPECTED_ERROR';
    }

    switch (error.status) {
      case 0:
        return 'CONNECTION_ERROR';

      case 401:
        return operation === 'sign-in' ? 'INVALID_CREDENTIALS' : 'ACCESS_DENIED';

      case 403:
        return 'ACCESS_DENIED';

      case 409:
        return operation === 'sign-up' ? 'REGISTRATION_CONFLICT' : 'UNEXPECTED_ERROR';

      default:
        return 'UNEXPECTED_ERROR';
    }
  }

  requestPasswordReset(command: RequestPasswordResetCommand): void {
    if (this.passwordRecoveryLoading() || this.passwordRecoveryCompleted()) {
      return;
    }

    this.executePasswordRecovery(this.iamApi.requestPasswordReset(command), false);
  }

  resetPassword(command: ResetPasswordCommand): void {
    if (this.passwordRecoveryLoading() || this.passwordRecoveryCompleted()) {
      return;
    }

    this.executePasswordRecovery(this.iamApi.resetPassword(command), true);
  }

  clearPasswordRecovery(): void {
    this.recoveryRequest?.unsubscribe();
    this.recoveryRequest = undefined;

    this.recoveryErrorSignal.set(null);
    this.recoveryStateSignal.set('idle');
  }

  private executePasswordRecovery(operation: Observable<void>, resetting: boolean): void {
    this.recoveryErrorSignal.set(null);
    this.recoveryStateSignal.set('pending');

    this.recoveryRequest = operation
      .pipe(
        finalize(() => {
          if (this.recoveryStateSignal() === 'pending') {
            this.recoveryStateSignal.set('idle');
          }
        }),
      )
      .subscribe({
        next: () => {
          this.recoveryStateSignal.set('completed');
        },
        error: (error: unknown) => {
          this.recoveryErrorSignal.set(this.resolvePasswordRecoveryError(error, resetting));
        },
      });
  }

  private resolvePasswordRecoveryError(error: unknown, resetting: boolean): PasswordRecoveryError {
    if (!(error instanceof HttpErrorResponse)) {
      return 'UNEXPECTED_ERROR';
    }

    if (error.status === 0) return 'CONNECTION_ERROR';
    if (error.status === 429) return 'RATE_LIMITED';

    if (resetting && [401, 404, 410].includes(error.status)) {
      return 'INVALID_LINK';
    }

    if ([400, 422].includes(error.status)) {
      return 'REQUEST_REJECTED';
    }

    return 'UNEXPECTED_ERROR';
  }
}
