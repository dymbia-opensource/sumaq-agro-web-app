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
import { AuthNavigationService } from '../../../../iam/infrastructure/auth-navigation.service';

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
  private readonly authNavigation = inject(AuthNavigationService);

  /** Display name provided by the current session projection. */
  readonly userName = computed(() => this.session.activeUser()?.displayName ?? '');
  protected signOut(): void {
    this.layout.closeSidebarOnHandset();
    this.authNavigation.signOut();
  }
}
