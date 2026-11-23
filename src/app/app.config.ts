import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEsPe from '@angular/common/locales/es-PE';
import { MatIconRegistry } from '@angular/material/icon';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateMultiHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { iamInterceptor } from './iam/infrastructure/iam.interceptor';
import { TranslatedTitleStrategy } from './shared/infrastructure/translated-title.strategy';

/** Spanish (Peru) data for dates and numbers; English is built in. */
registerLocaleData(localeEsPe, 'es');

/**
 * Translation files of `public/i18n/{lang}/`: one for `shared` and one per bounded context.
 * A new bounded context adds its file here.
 */
const TRANSLATION_FILES = [
  'shared',
  'farming',
  'crop',
  'profiles',
  'certification',
  'iam',
  'subscriptions',
];

/**
 * Root application configuration.
 *
 * @remarks
 * Registers the router, the HTTP client used by the infrastructure endpoints,
 * ngx-translate (it loads the translation file of each bounded context) and
 * the Material Symbols icon font for `<mat-icon>`.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([iamInterceptor]),
    ),
    provideTranslateService({
      loader: provideTranslateMultiHttpLoader({
        resources: TRANSLATION_FILES.map((file) => ({
          prefix: './i18n/',
          suffix: `/${file}.json`,
        })),
      }),
      fallbackLang: 'en',
      lang: 'en',
    }),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
  ],
};
