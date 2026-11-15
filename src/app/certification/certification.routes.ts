import { Routes } from '@angular/router';

/** Routes of the context; the screen is loaded when the certificates page opens. */
export const certificationRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./presentation/views/harvest-certificates/harvest-certificates').then(
        (m) => m.HarvestCertificates,
      ),
    title: 'certification.title',
  },
];
