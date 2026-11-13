import { Routes } from '@angular/router';
import { SubscriptionsShell } from './presentation/components/subscriptions-shell/subscriptions-shell';

const layout = () => import('../shared/presentation/components/layout/layout').then((m) => m.Layout);

/** Plan selection and checkout: no side menu. */
const checkoutPages: Routes = [
  {
    path: 'plans',
    loadComponent: () => import('./presentation/views/plans-catalog-view/plans-catalog-view').then((m) => m.PlansCatalogView,),
    title: 'Planes | SumaqAgro',
  },
  {
    path: 'checkout',
    loadComponent: () => import('./presentation/views/checkout-view/checkout-view').then((m) => m.CheckoutView),
    title: 'Pago | SumaqAgro',
  },
  { path: '',
    redirectTo: 'plans',
    pathMatch: 'full'
  },
];

/** Lazy-loaded routes for the Subscriptions and Payments context. */
export const subscriptionsRoutes: Routes = [
  {
    path: '',
    component: SubscriptionsShell,
    children: checkoutPages,
  },
  {
    // Subscription management keeps the app shell (side menu and top bar).
    path: '',
    loadComponent: layout,
    children: [
      {
        path: 'billing',
        loadComponent: () => import('./presentation/views/billing-history-view/billing-history-view').then((m) => m.BillingHistoryView,),
        title: 'Suscripción y pagos | SumaqAgro',
      },
    ],
  },
];
