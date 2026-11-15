import { BreakpointObserver } from '@angular/cdk/layout';
import { effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, merge } from 'rxjs';

/**
 * State shared by the parts of the app shell: the side menu and the top bar.
 *
 * @remarks
 * The menu stays open on wide screens; on phones it opens over the content
 * from the menu button of the top bar.
 */
@Injectable({ providedIn: 'root' })
export class LayoutStore {
  /** `true` on phones and small tablets. */
  readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  /** `true` while the browser has network connection. */
  readonly isOnline = toSignal(
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false)),
    ),
    { initialValue: navigator.onLine },
  );

  private readonly sidebarOpenedSignal = signal(true);

  /** `true` while the side menu is open. */
  readonly sidebarOpened = this.sidebarOpenedSignal.asReadonly();

  constructor() {
    // Open the menu on wide screens and close it on phones.
    effect(() => this.sidebarOpenedSignal.set(!this.isHandset()));
  }

  /** Opens or closes the side menu. */
  toggleSidebar(): void {
    this.sidebarOpenedSignal.update((opened) => !opened);
  }

  /**
   * Keeps the state when the menu closes by itself (for example, on its backdrop).
   * @param opened - New state of the menu.
   */
  setSidebarOpened(opened: boolean): void {
    this.sidebarOpenedSignal.set(opened);
  }

  /** Closes the menu after choosing an option, only on phones. */
  closeSidebarOnHandset(): void {
    if (this.isHandset()) {
      this.sidebarOpenedSignal.set(false);
    }
  }
}
