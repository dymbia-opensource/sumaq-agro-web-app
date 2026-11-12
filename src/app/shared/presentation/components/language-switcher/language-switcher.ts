import { UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/**
 * Segmented ES | EN control that changes the language of the whole app.
 *
 * @remarks
 * Each visit starts in English; users can switch languages during their visit.
 */
@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleModule, MatIconModule, MatTooltipModule, TranslatePipe, UpperCasePipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  private readonly translate = inject(TranslateService);

  /** Languages offered to the user. */
  readonly languages: string[] = ['es', 'en'];

  /** Language currently in use (reactive). */
  readonly currentLang = this.translate.currentLang;

  /**
   * Changes the language for the current visit.
   * @param language - Language code (`es` or `en`).
   */
  useLanguage(language: string): void {
    this.translate.use(language);
  }
}
