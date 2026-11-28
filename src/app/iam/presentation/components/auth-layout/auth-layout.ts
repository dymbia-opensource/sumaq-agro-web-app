import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { FooterContent } from '../../../../shared/presentation/components/footer-content/footer-content';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

/**
 * Shared visual structure for authentication views.
 *
 * @remarks
 * It also shows the legal links, so visitors can read the terms of service
 * and the privacy policy before they sign up.
 */
@Component({
  imports: [MatIconModule, TranslatePipe, LanguageSwitcher, FooterContent],
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
