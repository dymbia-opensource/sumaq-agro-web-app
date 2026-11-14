import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';

const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Watches session expiration using timers and browser lifecycle events.
 */
@Injectable({ providedIn: 'root' })
export class SessionExpiration {
  private expiresAt: number | null = null;
  private onExpired?: () => void;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    const document = inject(DOCUMENT);
    const window = document.defaultView;
    const checkExpiration = () => this.check();

    window?.addEventListener('focus', checkExpiration);
    window?.addEventListener('pageshow', checkExpiration);
    document.addEventListener('visibilitychange', checkExpiration);

    inject(DestroyRef).onDestroy(() => {
      this.stop();

      window?.removeEventListener('focus', checkExpiration);
      window?.removeEventListener('pageshow', checkExpiration);
      document.removeEventListener('visibilitychange', checkExpiration);
    });
  }

  start(expiresAt: number | null, onExpired: () => void): void {
    this.stop();

    if (expiresAt === null) return;

    if (!Number.isFinite(expiresAt)) {
      throw new Error('Session expiration must be a finite timestamp.');
    }

    this.expiresAt = expiresAt;
    this.onExpired = onExpired;

    this.check();
    this.schedule();
  }

  check(): void {
    if (this.expiresAt === null || Date.now() < this.expiresAt) {
      return;
    }

    const onExpired = this.onExpired;

    this.stop();
    onExpired?.();
  }

  stop(): void {
    this.clearTimer();
    this.expiresAt = null;
    this.onExpired = undefined;
  }

  private schedule(): void {
    this.clearTimer();

    if (this.expiresAt === null) return;

    const remaining = Math.max(0, this.expiresAt - Date.now());
    const delay = Math.min(remaining, MAX_TIMEOUT_MS);

    this.timer = setTimeout(() => {
      this.check();
      this.schedule();
    }, delay);
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
    }

    this.timer = undefined;
  }
}
