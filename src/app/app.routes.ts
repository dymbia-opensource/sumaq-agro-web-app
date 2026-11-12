import { Routes } from '@angular/router';
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
 * `subscriptions/billing` opens the app shell from its own routes. It must be
 * declared before the `Layout` route, whose `**` would otherwise match it.
 */
export const routes: Routes = [
  // Pages without the shell
  { path: 'iam', loadChildren: () => import('./iam/iam.routes').then((m) => m.iamRoutes) },
  {
    path: 'verify/:token',
    loadComponent: publicTraceabilityView,
    title: `Verificar certificado | ${baseTitle}`,
  },
  { path: '', redirectTo: '/iam/sign-in', pathMatch: 'full' },

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
          { path: 'field-management', loadChildren: fieldManagementRoutes },
          { path: 'crop-health', loadChildren: cropHealthRoutes },
          { path: 'profiles', loadChildren: profilesRoutes },
          { path: 'harvest-certification', loadChildren: harvestCertificationRoutes },
        ],
      },
      { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
    ],
  },
];
