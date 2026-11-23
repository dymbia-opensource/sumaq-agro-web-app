import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { RequestPasswordResetCommand } from '../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../domain/model/commands/reset-password.command';
import { SignInCommand } from '../domain/model/commands/sign-in.command';
import { SignUpCommand } from '../domain/model/commands/sign-up.command';
import { User } from '../domain/model/entities/user.entity';
import { UserRole } from '../domain/model/entities/user-role';
import { IamApi } from '../infrastructure/iam-api';
import { SignInAssembler } from '../infrastructure/assemblers/sign-in.assembler';
import { SignInResource } from '../infrastructure/responses/sign-in.response';

/** Identity of the signed-in user that the other bounded contexts read. */
export interface SessionParticipant {
  readonly id: number;
  readonly displayName: string;
  readonly experience: UserRole;
  readonly initialRoute: string;
}

/** Reasons a sign-in or sign-up can fail; each one has its own translation. */
export type IamError =
  | 'INVALID_CREDENTIALS'
  | 'REGISTRATION_CONFLICT'
  | 'ACCESS_DENIED'
  | 'CONNECTION_ERROR'
  | 'UNEXPECTED_ERROR';

/** Reasons a password recovery step can fail; each one has its own translation. */
export type PasswordRecoveryError =
  | 'INVALID_LINK'
  | 'RATE_LIMITED'
  | 'CONNECTION_ERROR'
  | 'REQUEST_REJECTED'
  | 'UNEXPECTED_ERROR';

/** Keys of the session kept in `localStorage`, so a reload does not sign the user out. */
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const ROLE_PRIORITY: readonly UserRole[] = ['COOPERATIVE_DIRECTOR', 'AGRONOMIST', 'FARMER'];

const INITIAL_ROUTES: Record<UserRole, string> = {
  FARMER: '/dashboard',
  COOPERATIVE_DIRECTOR: '/cooperative/dashboard',
  AGRONOMIST: '/pest-reports',
};

/**
 * Reads the expiration of a JWT (`exp` claim, in seconds).
 * @param token - Access token returned by `POST /tokens`.
 * @returns The expiration in milliseconds, or 0 when the token cannot be read.
 */
function tokenExpiration(token: string): number {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload)) as { exp?: number };
    return typeof claims.exp === 'number' ? claims.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * Holds IAM application state and orchestrates authentication flows.
 */
@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly iamApi = inject(IamApi);
  private readonly assembler = new SignInAssembler();

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly currentTokenSignal = signal<string | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<IamError | null>(null);
  private readonly registrationCompletedSignal = signal<boolean>(false);
  private readonly recoveryLoadingSignal = signal<boolean>(false);
  private readonly recoveryCompletedSignal = signal<boolean>(false);
  private readonly recoveryErrorSignal = signal<PasswordRecoveryError | null>(null);

  /** Readonly signal for the signed-in user. */
  readonly currentUser = this.currentUserSignal.asReadonly();

  /** Readonly signal for the current authentication token. */
  readonly currentToken = this.currentTokenSignal.asReadonly();

  /** Computed signal indicating if the user is signed in. */
  readonly isSignedIn = computed(() => this.currentToken() !== null);

  /** Signal indicating if a sign-in or sign-up is running. */
  readonly isLoading = this.loadingSignal.asReadonly();

  /** Reason of the last failed sign-in or sign-up. */
  readonly error = this.errorSignal.asReadonly();

  /** Signal indicating if the last sign-up succeeded. */
  readonly registrationCompleted = this.registrationCompletedSignal.asReadonly();

  /** Signal indicating if a password recovery step is running. */
  readonly passwordRecoveryLoading = this.recoveryLoadingSignal.asReadonly();

  /** Signal indicating if the last password recovery step succeeded. */
  readonly passwordRecoveryCompleted = this.recoveryCompletedSignal.asReadonly();

  /** Reason of the last failed password recovery step. */
  readonly passwordRecoveryError = this.recoveryErrorSignal.asReadonly();

  /**
   * Identity of the signed-in user for the other bounded contexts: its main
   * role (`experience`) and the page it starts at.
   */
  readonly activeUser = computed<SessionParticipant | null>(() => {
    const user = this.currentUser();
    if (!user || !this.isSignedIn()) return null;
    const experience = ROLE_PRIORITY.find((role) => user.hasRole(role));
    if (!experience) return null;
    return {
      id: user.id as number,
      displayName: user.fullName || user.email,
      experience,
      initialRoute: INITIAL_ROUTES[experience],
    };
  });

  /** Computed signal indicating if there is a signed-in user with a known role. */
  readonly hasActiveUser = computed(() => this.activeUser() !== null);

  /**
   * Creates an instance of IamStore and restores the session saved before a reload.
   */
  constructor() {
    this.restoreSession();
  }

  /**
   * Executes sign-in and tells the view which page to open next: the private
   * page the user asked for, or the start page of their role.
   * @param signInCommand - Credentials command.
   * @param onSignedIn - Receives the page to open.
   * @param returnUrl - Private page the user tried to open before signing in.
   */
  signIn(
    signInCommand: SignInCommand,
    onSignedIn: (destination: string) => void,
    returnUrl: string | null = null,
  ): void {
    if (this.isLoading()) return;
    this.clearSession();
    this.errorSignal.set(null);
    this.loadingSignal.set(true);
    this.iamApi.signIn(signInCommand).subscribe({
      next: (signInResource) => {
        this.saveSession(signInResource);
        this.loadingSignal.set(false);
        const isSafeReturnUrl = !!returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//');
        const destination = isSafeReturnUrl
          ? returnUrl
          : (this.activeUser()?.initialRoute ?? '/iam/sign-in');
        onSignedIn(destination);
      },
      error: (error: unknown) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.resolveError(error, 'sign-in'));
      },
    });
  }

  /**
   * Executes sign-up; the view then invites the user to sign in.
   * @param signUpCommand - Registration command.
   */
  signUp(signUpCommand: SignUpCommand): void {
    if (this.isLoading()) return;
    this.errorSignal.set(null);
    this.registrationCompletedSignal.set(false);
    this.loadingSignal.set(true);
    this.iamApi.signUp(signUpCommand).subscribe({
      next: () => {
        this.loadingSignal.set(false);
        this.registrationCompletedSignal.set(true);
      },
      error: (error: unknown) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.resolveError(error, 'sign-up'));
      },
    });
  }

  /**
   * Clears the authentication state. The shells (`Layout`, `SubscriptionsShell`)
   * watch the session and open the sign-in page.
   */
  signOut(): void {
    this.clearSession();
  }

  /**
   * Clears the session when its token has expired (JWTs of the platform last 30 minutes).
   * Guards call it before checking {@link activeUser}.
   */
  checkSessionExpiration(): void {
    const token = this.currentToken();
    if (token && tokenExpiration(token) <= Date.now()) this.clearSession();
  }

  /** Clears the result of the last sign-in or sign-up. */
  clearFeedback(): void {
    this.errorSignal.set(null);
    this.registrationCompletedSignal.set(false);
  }

  /**
   * Asks the platform to email a password recovery link.
   * @param command - Command with the email of the account.
   */
  requestPasswordReset(command: RequestPasswordResetCommand): void {
    if (this.passwordRecoveryLoading()) return;
    this.recoveryErrorSignal.set(null);
    this.recoveryLoadingSignal.set(true);
    this.iamApi.requestPasswordReset(command).subscribe({
      next: () => this.completePasswordRecovery(),
      error: (error: unknown) => this.failPasswordRecovery(error, false),
    });
  }

  /**
   * Sets a new password with the token of the recovery link.
   * @param command - Command with the token and the new password.
   */
  resetPassword(command: ResetPasswordCommand): void {
    if (this.passwordRecoveryLoading()) return;
    this.recoveryErrorSignal.set(null);
    this.recoveryLoadingSignal.set(true);
    this.iamApi.resetPassword(command).subscribe({
      next: () => this.completePasswordRecovery(),
      error: (error: unknown) => this.failPasswordRecovery(error, true),
    });
  }

  /** Clears the result of the last password recovery step. */
  clearPasswordRecovery(): void {
    this.recoveryLoadingSignal.set(false);
    this.recoveryCompletedSignal.set(false);
    this.recoveryErrorSignal.set(null);
  }

  private completePasswordRecovery(): void {
    this.recoveryLoadingSignal.set(false);
    this.recoveryCompletedSignal.set(true);
  }

  private failPasswordRecovery(error: unknown, resetting: boolean): void {
    this.recoveryLoadingSignal.set(false);
    this.recoveryErrorSignal.set(this.resolvePasswordRecoveryError(error, resetting));
  }

  private saveSession(signInResource: SignInResource): void {
    localStorage.setItem(TOKEN_KEY, signInResource.token);
    localStorage.setItem(USER_KEY, JSON.stringify({ ...signInResource, token: undefined }));
    this.currentTokenSignal.set(signInResource.token);
    this.currentUserSignal.set(this.assembler.toEntityFromResource(signInResource));
  }

  private restoreSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    if (!token || !user || tokenExpiration(token) <= Date.now()) {
      this.clearSession();
      return;
    }
    try {
      const resource = { ...(JSON.parse(user) as SignInResource), token };
      this.currentTokenSignal.set(token);
      this.currentUserSignal.set(this.assembler.toEntityFromResource(resource));
    } catch {
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentTokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  private resolveError(error: unknown, operation: 'sign-in' | 'sign-up'): IamError {
    if (!(error instanceof HttpErrorResponse)) return 'UNEXPECTED_ERROR';
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

  private resolvePasswordRecoveryError(error: unknown, resetting: boolean): PasswordRecoveryError {
    if (!(error instanceof HttpErrorResponse)) return 'UNEXPECTED_ERROR';
    if (error.status === 0) return 'CONNECTION_ERROR';
    if (error.status === 429) return 'RATE_LIMITED';
    if (resetting && [400, 401, 404, 410].includes(error.status)) return 'INVALID_LINK';
    if ([400, 422].includes(error.status)) return 'REQUEST_REJECTED';
    return 'UNEXPECTED_ERROR';
  }
}
