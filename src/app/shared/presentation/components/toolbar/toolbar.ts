import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutStore } from '../layout/layout.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { AuthNavigation } from '../../../../iam/infrastructure/auth-navigation';
import { settingsRouteFor } from '../../../infrastructure/navigation-config';

/**
 * Top bar of the shell: mobile menu, search, connection status and user menu.
 */
@Component({
  selector: 'app-toolbar',
  imports: [
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    TranslatePipe,
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class Toolbar {
  protected readonly layout = inject(LayoutStore);
  private readonly session = inject(IamStore);
  private readonly authNavigation = inject(AuthNavigation);

  /** Display name provided by the current session projection. */
  readonly userName = computed(() => this.session.activeUser()?.displayName ?? '');

  /** Account page of the signed-in role; a director manages the cooperative one. */
  protected readonly settingsRoute = computed(() => {
    const experience = this.session.activeUser()?.experience;

    return experience ? settingsRouteFor(experience) : '/settings';
  });
  protected signOut(): void {
    this.layout.closeSidebarOnHandset();
    this.authNavigation.signOut();
  }
}
