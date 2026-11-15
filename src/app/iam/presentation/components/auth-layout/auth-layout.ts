import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

/**
 * Shared visual structure for authentication views.
 */
@Component({
  imports: [MatIconModule, TranslatePipe, LanguageSwitcher],
  selector: 'app-auth-layout',
  styleUrl: './auth-layout.css',
  templateUrl: './auth-layout.html',
})
export class AuthLayout {
  readonly compact = input(false);
  /** Replace the file in public/images to update all authentication views. */
  readonly imageSrc = input('/images/img-login-register.jpg');
  readonly imagePosition = input('35% center');

  /**
   * Whether to show the language switcher in the top right corner of the layout.
   */
  readonly showLanguageSwitcher = input(false);
}
