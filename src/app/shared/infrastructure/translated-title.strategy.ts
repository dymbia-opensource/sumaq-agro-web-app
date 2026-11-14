import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/** Name of the product, the second half of every tab. */
const BRAND = 'SumaqAgro';

/**
 * Names the browser tab in the language the visitor chose.
 *
 * @remarks
 * A route carries the translation key of its page instead of a literal, so the
 * tab says what the page says and follows the language switch without a
 * reload. While the translation file is still loading the key resolves to
 * itself; the tab then shows the product alone instead of a raw key.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);

  /** Key of the page on screen, kept to rename the tab on a language change. */
  private pageKey: string | null = null;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.pageKey = this.buildTitle(snapshot) ?? null;
    this.apply();
  }

  private apply(): void {
    const key = this.pageKey;
    const name = key ? this.translate.instant(key) : null;

    this.title.setTitle(name && name !== key ? `${name} | ${BRAND}` : BRAND);
  }
}
