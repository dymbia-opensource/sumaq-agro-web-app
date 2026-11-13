import { iamGuard } from '../iam/infrastructure/iam.guard';
import { Routes } from '@angular/router';

const farmerSettingsView = () =>
  import('./presentation/views/farmer-settings-view/farmer-settings-view').then(
    (module) => module.FarmerSettingsView,
  );
export const cooperativeDashboardView = () => import('./presentation/views/cooperative-dashboard-view/cooperative-dashboard-view').then((module) => module.CooperativeDashboardView);
const cooperativeSettingsView = () => import('./presentation/views/cooperative-settings-view/cooperative-settings-view').then((module) => module.CooperativeSettingsView);

/** Routes owned by the Profiles bounded context. */
export const profilesRoutes: Routes = [
  {
    path: 'settings',
    loadComponent: farmerSettingsView,
    title: 'Configuración y ayuda | SumaqAgro',
  },
  { path: 'cooperative/dashboard', redirectTo: '/cooperative/dashboard', pathMatch: 'full' },
  {
    path: 'cooperative/registration',
    canActivate: [iamGuard],
    data: { roles: ['COOPERATIVE_DIRECTOR'] },
    loadComponent: () =>
      import('./presentation/views/cooperative-registration-view/cooperative-registration-view').then(
        (module) => module.CooperativeRegistrationView,
      ),
    title: 'Registro de cooperativa | SumaqAgro',
  },
  {
    path: 'cooperative/members',
    canActivate: [iamGuard],
    data: { roles: ['COOPERATIVE_DIRECTOR'] },
    loadComponent: () => import('./presentation/views/cooperative-members-view/cooperative-members-view')
      .then((module) => module.CooperativeMembersView),
    title: 'Padrón de socios | SumaqAgro',
  },
  {
    path: 'cooperative/members/:id',
    canActivate: [iamGuard],
    data: { roles: ['COOPERATIVE_DIRECTOR'] },
    loadComponent: () => import('./presentation/views/cooperative-members-view/cooperative-members-view')
      .then((module) => module.CooperativeMembersView),
    title: 'Expediente del socio | SumaqAgro',
  },
  { path: 'cooperative/settings', loadComponent: cooperativeSettingsView, title: 'Configuración institucional | SumaqAgro' },
  { path: '', redirectTo: '/cooperative/dashboard', pathMatch: 'full' },
];
