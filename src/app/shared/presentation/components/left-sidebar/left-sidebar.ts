import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { LayoutStore } from '../layout/layout.store';
import {
  activeNavigationLink,
  navigationFor,
} from '../../../infrastructure/navigation-config';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Side menu of the shell: brand, options of the user's role, offline status,
 * language and sign out.
 */
@Component({
  selector: 'app-left-sidebar',
  imports: [
    RouterLink,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    TranslatePipe,
    LanguageSwitcher,
  ],
  templateUrl: './left-sidebar.html',
  styleUrl: './left-sidebar.css',
})
export class LeftSidebar {
  protected readonly layout = inject(LayoutStore);
  private readonly session = inject(IamStore);
  private readonly router = inject(Router);

  /** Address on screen, which changes on every finished navigation. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Entry of the menu the visitor is inside, marked while the page is open. */
  protected readonly activeLink = computed(() => {
    const user = this.session.activeUser();

    return user ? activeNavigationLink(user.experience, this.url()) : null;
  });

  /** Navigation generated from the current participant's primary role. */
  readonly sections = computed(() => {
    const user = this.session.activeUser();

    return user ? navigationFor(user.experience) : [];
  });

  protected signOut(): void {
    this.layout.closeSidebarOnHandset();
    this.session.signOut(this.router);
  }
}
