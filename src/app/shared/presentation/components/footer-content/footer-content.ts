import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';

/**
 * Footer of the application with the copyright and the legal links.
 *
 * @remarks
 * The terms of service, privacy policy and cookie policy live in the Landing Page,
 * so both experiences share the same legal documents. Each link opens in a new tab.
 */
@Component({
  selector: 'app-footer-content',
  imports: [TranslatePipe],
  templateUrl: './footer-content.html',
  styleUrl: './footer-content.css',
})
export class FooterContent {
  /** Year shown in the copyright notice. */
  protected readonly currentYear = new Date().getFullYear();

  /** Terms of service page of the Landing Page. */
  protected readonly termsUrl = `${environment.landingPageUrl}/service`;

  /** Privacy policy page of the Landing Page. */
  protected readonly privacyUrl = `${environment.landingPageUrl}/policy`;

  /** Cookie policy page of the Landing Page. */
  protected readonly cookiesUrl = `${environment.landingPageUrl}/cookie`;
}
