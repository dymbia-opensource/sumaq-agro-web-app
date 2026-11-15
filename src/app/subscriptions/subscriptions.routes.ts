import { Routes } from '@angular/router';
import { SubscriptionsShell } from './presentation/components/subscriptions-shell/subscriptions-shell';

const layout = () =>
  import('../shared/presentation/components/layout/layout').then((m) => m.Layout);

/** Plan selection and checkout: no side menu. */
const checkoutPages: Routes = [
  {
    path: 'plans',
    loadComponent: () =>
      import('./presentation/views/plans-catalog/plans-catalog').then(
        (m) => m.PlansCatalog,
      ),
    title: 'subscriptions.catalog.title',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./presentation/views/checkout/checkout').then((m) => m.Checkout),
    title: 'subscriptions.checkout.title',
  },
];

/** Lazy-loaded routes for the Subscriptions and Payments context. */
export const subscriptionsRoutes: Routes = [
  { path: 'billing', redirectTo: '', pathMatch: 'full' },
  {
    // Subscription management keeps the app shell (side menu and top bar).
    path: '',
    pathMatch: 'full',
    loadComponent: layout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./presentation/views/billing-history/billing-history').then(
            (m) => m.BillingHistory,
          ),
        title: 'subscriptions.billing.title',
      },
    ],
  },
  {
    path: '',
    component: SubscriptionsShell,
    children: checkoutPages,
  },
];
