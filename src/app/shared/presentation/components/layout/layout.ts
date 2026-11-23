import { Component, effect, inject, untracked } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterOutlet } from '@angular/router';
import { IamStore } from '../../../../iam/application/iam.store';
import { LeftSidebar } from '../left-sidebar/left-sidebar';
import { Toolbar } from '../toolbar/toolbar';
import { LayoutStore } from './layout.store';

/**
 * Shell of the private pages: side menu, top bar and the routed content.
 *
 * @remarks
 * It is the parent route of every bounded context. The pages without menu
 * (authentication and public QR verification) are outside of it.
 */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MatSidenavModule, LeftSidebar, Toolbar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  protected readonly layout = inject(LayoutStore);
  private readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (this.iamStore.isSignedIn()) return;

      untracked(() => {
        if (this.router.currentNavigation()) return;

        void this.router.navigate(['/iam/sign-in'], {
          queryParams: { returnUrl: this.router.url },
          replaceUrl: true,
        });
      });
    });
  }
}
