import { Service } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthenticatedUser } from '../../domain/model/entities/authenticated-user.entity';
import { UserRole } from '../../domain/model/value-objects/user-role';

export const MOCK_SESSION_STORAGE_KEY = 'sumaq-agro.iam.mock-session.v1';
export const MOCK_SESSION_DURATION_MS = 30 * 60 * 1000;

export interface StoredSession {
  readonly user: AuthenticatedUser;
  readonly expiresAt: number;
}

const supportedRoles: readonly UserRole[] = ['FARMER', 'COOPERATIVE_DIRECTOR', 'AGRONOMIST'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Tab-scoped persistence for development sessions only. It never validates real credentials. */
@Service()
export class SessionStorageService {
  get enabled(): boolean {
    return !environment.production && environment.useMockAuthentication;
  }

  save(user: AuthenticatedUser): StoredSession | null {
    if (!this.enabled || !user.token.startsWith('mock-session-')) return null;

    const issuedAt = Date.now();
    const expiresAt = issuedAt + MOCK_SESSION_DURATION_MS;

    try {
      sessionStorage.setItem(
        MOCK_SESSION_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          issuedAt,
          expiresAt,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            roles: user.roles,
            token: user.token,
          },
        }),
      );
    } catch {
      // Storage may be unavailable; the current in-memory session can still expire normally.
    }

    return { user, expiresAt };
  }

  restore(): StoredSession | null {
    if (!this.enabled) return null;

    try {
      const raw = sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY);
      if (raw === null) return null;

      const stored: unknown = JSON.parse(raw);
      const now = Date.now();

      if (
        !isRecord(stored) ||
        stored['version'] !== 1 ||
        typeof stored['issuedAt'] !== 'number' ||
        !Number.isSafeInteger(stored['issuedAt']) ||
        typeof stored['expiresAt'] !== 'number' ||
        !Number.isSafeInteger(stored['expiresAt']) ||
        stored['issuedAt'] > now ||
        stored['expiresAt'] <= now ||
        stored['expiresAt'] - stored['issuedAt'] !== MOCK_SESSION_DURATION_MS
      ) {
        this.clear();
        return null;
      }

      const account = stored['user'];
      if (
        !isRecord(account) ||
        !(
          (typeof account['id'] === 'number' &&
            Number.isSafeInteger(account['id']) &&
            account['id'] > 0) ||
          (typeof account['id'] === 'string' &&
            /^[1-9][0-9]*$/.test(account['id']) &&
            Number.isSafeInteger(Number(account['id'])))
        ) ||
        typeof account['email'] !== 'string' ||
        !account['email'].trim() ||
        typeof account['token'] !== 'string' ||
        !account['token'].startsWith('mock-session-') ||
        !Array.isArray(account['roles']) ||
        account['roles'].length === 0 ||
        !account['roles'].every(
          (role: unknown) => typeof role === 'string' && supportedRoles.includes(role as UserRole),
        )
      ) {
        this.clear();
        return null;
      }

      return {
        user: new AuthenticatedUser({
          id: account['id'],
          email: account['email'],
          fullName: typeof account['fullName'] === 'string' ? account['fullName'] : undefined,
          roles: account['roles'],
          token: account['token'],
        }),
        expiresAt: stored['expiresAt'],
      };
    } catch {
      this.clear();
      return null;
    }
  }

  clear(): void {
    if (!this.enabled) return;

    try {
      sessionStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
    } catch {
      // A denied storage operation must not prevent local sign-out.
    }
  }
}
