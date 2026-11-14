import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { iamRoutes } from './iam/iam.routes';
import { iamGuard } from './iam/infrastructure/iam.guard';
import {activeSubscriptionGuard} from './subscriptions/infrastructure/active-subscription.guard';

const layout = () => import('./shared/presentation/components/layout/layout').then((m) => m.Layout);

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

const fieldManagementRoutes = () =>
  import('./field-management/field-management.routes').then((m) => m.fieldManagementRoutes);

const cropHealthRoutes = () =>
  import('./crop-health/crop-health.routes').then((m) => m.cropHealthRoutes);

const profilesRoutes = () => import('./profiles/profiles.routes').then((m) => m.profilesRoutes);

const harvestCertificationRoutes = () =>
  import('./harvest-certification/harvest-certification.routes').then(
    (m) => m.harvestCertificationRoutes,
  );

const subscriptionsRoutes = () =>
  import('./subscriptions/subscriptions.routes').then((m) => m.subscriptionsRoutes);

const publicTraceabilityView = () =>
  import('./harvest-certification/presentation/views/public-traceability-view/public-traceability-view').then(
    (m) => m.PublicTraceabilityView,
  );

function redirectLegacyPath(destination: string): RedirectFunction {
  return ({ params, queryParams, fragment }) => {
    const segments = destination.split('/').map((segment) =>
      segment.startsWith(':') ? params[segment.slice(1)] : segment,
    );
    return inject(Router).createUrlTree(['/', ...segments], { queryParams, fragment: fragment ?? undefined });
  };
}

const baseTitle = 'SumaqAgro';

/**
 * Root routes. Each bounded context adds its own `*.routes.ts` with lazy loading.
 *
 * @remarks
 * The private pages of the workspace are children of the shell (`Layout`: side
 * menu and top bar) and require authentication on entry and child navigation.
 * IAM views and public QR verification are shown without the shell.
 *
 * Subscriptions is outside the shell on purpose: plan selection and checkout
 * use their own minimal shell (`SubscriptionsShell`, no side menu), while
 * `subscriptions` opens the app shell from its own routes. It must be
 * declared before the `Layout` route, whose `**` would otherwise match it.
 */
export const routes: Routes = [
  // Pages without the shell
  ...iamRoutes,
  {
    path: 'verify/:token',
    loadComponent: publicTraceabilityView,
    title: `Verificar certificado | ${baseTitle}`,
  },
  { path: '', redirectTo: '/sign-in', pathMatch: 'full' },

  // Subscriptions: each of its pages chooses its own layout
  {
    path: 'subscriptions',
    canActivate: [iamGuard],
    canActivateChild: [iamGuard],
    loadChildren: subscriptionsRoutes,
  },

  // Pages inside the shell
  {
    path: '',
    loadComponent: layout,
    canActivate: [iamGuard],
    canActivateChild: [iamGuard],
    children: [
      {
        path: '',
        canActivateChild: [activeSubscriptionGuard],
        children: [
          {
            path: 'advisor',
            loadComponent: () => import('./crop-health/crop-health.routes').then((m) => m.diagnosisInboxView()),
            title: 'Consultar al asesor | SumaqAgro',
          },
          {
            path: 'alerts',
            loadComponent: () => import('./crop-health/crop-health.routes').then((m) => m.agriculturalAlertsView()),
            title: 'Alertas agrícolas | SumaqAgro',
          },
          { path: 'certificates', loadChildren: harvestCertificationRoutes },
          { path: 'harvest-certification/certificates', redirectTo: '/certificates', pathMatch: 'full' },
          { path: 'harvest-certification', redirectTo: '/certificates', pathMatch: 'full' },
          {
            path: 'dashboard',
            providers: [provideCharts(withDefaultRegisterables())],
            loadComponent: () => import('./field-management/field-management.routes').then((m) => m.myPlotDashboardView()),
            title: 'Mi parcela | SumaqAgro',
          },
          {
            path: 'cooperative/dashboard',
            providers: [provideCharts(withDefaultRegisterables())],
            loadComponent: () => import('./profiles/profiles.routes').then((m) => m.cooperativeDashboardView()),
            title: 'Dashboard institucional | SumaqAgro',
          },
          { path: 'field-management/plots/new', redirectTo: redirectLegacyPath('plots/new'), pathMatch: 'full' },
          { path: 'field-management/plots/:id/boundary', redirectTo: redirectLegacyPath('plots/:id/boundary'), pathMatch: 'full' },
          { path: 'field-management/plots/:id/soil', redirectTo: redirectLegacyPath('plots/:id/soil'), pathMatch: 'full' },
          { path: 'field-management/plots/:id', redirectTo: redirectLegacyPath('plots/:id'), pathMatch: 'full' },
          { path: 'field-management/plots', redirectTo: redirectLegacyPath('plots'), pathMatch: 'full' },
          { path: 'field-management/campaigns/new', redirectTo: redirectLegacyPath('campaigns/new'), pathMatch: 'full' },
          { path: 'field-management/campaigns', redirectTo: redirectLegacyPath('campaigns'), pathMatch: 'full' },
          { path: 'field-management/finances/expenses/new/inputs', redirectTo: redirectLegacyPath('finances/expenses/new/inputs'), pathMatch: 'full' },
          { path: 'field-management/finances/expenses/new/labor', redirectTo: redirectLegacyPath('finances/expenses/new/labor'), pathMatch: 'full' },
          { path: 'field-management/finances/expenses/new/freight', redirectTo: redirectLegacyPath('finances/expenses/new/freight'), pathMatch: 'full' },
          { path: 'field-management/finances/expenses/new', redirectTo: redirectLegacyPath('finances/expenses/new'), pathMatch: 'full' },
          { path: 'field-management/finances/reports', redirectTo: redirectLegacyPath('finances/reports'), pathMatch: 'full' },
          { path: 'field-management/finances', redirectTo: redirectLegacyPath('finances'), pathMatch: 'full' },
          { path: 'crop-health/assigned-plots', redirectTo: redirectLegacyPath('assigned-plots'), pathMatch: 'full' },
          { path: 'crop-health/monitoring', redirectTo: redirectLegacyPath('monitoring'), pathMatch: 'full' },
          { path: 'crop-health/inspections', redirectTo: redirectLegacyPath('inspections'), pathMatch: 'full' },
          { path: 'crop-health/prescriptions', redirectTo: redirectLegacyPath('prescriptions'), pathMatch: 'full' },
          { path: 'crop-health/inbox', redirectTo: redirectLegacyPath('pest-reports'), pathMatch: 'full' },
          { path: 'crop-health/report-pest', redirectTo: redirectLegacyPath('pest-reports/new'), pathMatch: 'full' },
          { path: 'crop-health/reports/:id', redirectTo: redirectLegacyPath('pest-reports/:id'), pathMatch: 'full' },
          { path: 'crop-health/prescribe', redirectTo: redirectLegacyPath('prescriptions/new'), pathMatch: 'full' },
          { path: 'profiles/settings', redirectTo: redirectLegacyPath('settings'), pathMatch: 'full' },
          { path: 'profiles/cooperative/registration', redirectTo: redirectLegacyPath('cooperative/registration'), pathMatch: 'full' },
          { path: 'profiles/cooperative/members/:id', redirectTo: redirectLegacyPath('cooperative/members/:id'), pathMatch: 'full' },
          { path: 'profiles/cooperative/members', redirectTo: redirectLegacyPath('cooperative/members'), pathMatch: 'full' },
          { path: 'profiles/cooperative/settings', redirectTo: redirectLegacyPath('cooperative/settings'), pathMatch: 'full' },
          { path: 'field-management/dashboard', redirectTo: redirectLegacyPath('dashboard'), pathMatch: 'full' },
          { path: 'field-management', redirectTo: redirectLegacyPath('dashboard'), pathMatch: 'full' },
          { path: 'crop-health/advisor', redirectTo: redirectLegacyPath('advisor'), pathMatch: 'full' },
          { path: 'crop-health/alerts', redirectTo: redirectLegacyPath('alerts'), pathMatch: 'full' },
          { path: 'crop-health', redirectTo: redirectLegacyPath('monitoring'), pathMatch: 'full' },
          { path: 'profiles/cooperative/dashboard', redirectTo: redirectLegacyPath('cooperative/dashboard'), pathMatch: 'full' },
          { path: 'profiles', redirectTo: redirectLegacyPath('cooperative/dashboard'), pathMatch: 'full' },
          { path: '', loadChildren: fieldManagementRoutes },
          { path: '', loadChildren: cropHealthRoutes },
          { path: '', loadChildren: profilesRoutes },
        ],
      },
      { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
    ],
  },
];
