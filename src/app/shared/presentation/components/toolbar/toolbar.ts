import { Component, computed, inject, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutStore } from '../layout/layout.store';
import { CropStore } from '../../../../crop/application/crop.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { settingsRouteFor } from '../../../infrastructure/navigation-config';

/**
 * Top bar of the shell: mobile menu, search, connection status and user menu.
 */
@Component({
  selector: 'app-toolbar',
  imports: [
    RouterLink,
    MatAutocompleteModule,
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

  private readonly crop = inject(CropStore);
  private readonly router = inject(Router);
  protected readonly query = signal('');
  protected readonly searchLoading = this.crop.scopeLoading;
  protected readonly plotMatches = computed(() => {
    const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    const query = normalize(this.query().trim());
    if (!query) return [];
    const matches = this.crop.plots().filter((plot) => normalize(plot.name).includes(query));
    return matches.sort((a, b) =>
      Number(normalize(b.name) === query) - Number(normalize(a.name) === query) ||
      a.name.localeCompare(b.name),
    ).slice(0, 8);
  });

  protected openPlot(plotId: number, input: HTMLInputElement): void {
    if (!this.crop.plots().some((plot) => plot.id === plotId)) return;
    this.crop.selectPlot(plotId);
    this.query.set('');
    input.value = '';
    void this.router.navigate(['/monitoring']);
  }

  /** Display name provided by the current session projection. */
  readonly userName = computed(() => this.session.activeUser()?.displayName ?? '');

  /** Account page of the signed-in role; a director manages the cooperative one. */
  protected readonly settingsRoute = computed(() => {
    const experience = this.session.activeUser()?.experience;

    return experience ? settingsRouteFor(experience) : '/settings';
  });
  protected signOut(): void {
    this.layout.closeSidebarOnHandset();
    this.session.signOut(this.router);
  }
}
