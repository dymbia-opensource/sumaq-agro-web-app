import { Component, computed, effect, inject, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

/**
 * Shell of the plan selection and checkout pages.
 *
 * @remarks
 * Shows a minimal header (brand, language, user, sign out) with no side menu,
 * so the user stays focused on activating a plan. It also shares the
 * subscription state between the catalog and the checkout.
 */
@Component({
  imports: [RouterOutlet, MatButtonModule, MatIconModule, TranslatePipe, LanguageSwitcher],
  selector: 'app-subscriptions-shell',
  styleUrl: './subscriptions-shell.css',
  templateUrl: './subscriptions-shell.html',
})
export class SubscriptionsShell {
  private readonly session = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly userName = computed(() => this.session.activeUser()?.displayName ?? '');

  constructor() {
    // Same behavior as the Layout: if the session is lost, go back to sign in.
    effect(() => {
      if (this.session.isSignedIn()) return;

      untracked(() => {
        if (this.router.currentNavigation()) return;

        void this.router.navigate(['/iam/sign-in'], {
          queryParams: { returnUrl: this.router.url },
          replaceUrl: true,
        });
      });
    });
  }

  protected signOut(): void {
    this.session.signOut();
  }
}
