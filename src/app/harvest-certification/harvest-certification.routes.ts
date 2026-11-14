import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/** Rutas internas del contexto; la pantalla se carga al entrar a certificados. */
export const harvestCertificationRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./presentation/views/harvest-certificates-view/harvest-certificates-view').then((m) => m.HarvestCertificatesView),
    title: () => `${inject(TranslateService).instant('harvest-certification.page-title')} | SumaqAgro`,
  },
];
