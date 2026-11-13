import { iamGuard } from '../iam/infrastructure/iam.guard';
import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

const farmerSettingsView = () =>
  import('./presentation/views/farmer-settings-view/farmer-settings-view').then(
    (module) => module.FarmerSettingsView,
  );
const cooperativeDashboardView = () => import('./presentation/views/cooperative-dashboard-view/cooperative-dashboard-view').then((module) => module.CooperativeDashboardView);
const cooperativeSettingsView = () => import('./presentation/views/cooperative-settings-view/cooperative-settings-view').then((module) => module.CooperativeSettingsView);

/** Routes owned by the Profiles bounded context. */
export const profilesRoutes: Routes = [
  {
    path: 'settings',
    loadComponent: farmerSettingsView,
    title: 'Configuración y ayuda | SumaqAgro',
  },
  {
    path: 'cooperative/dashboard',
    providers: [provideCharts(withDefaultRegisterables())],
    loadComponent: cooperativeDashboardView,
    title: 'Dashboard institucional | SumaqAgro',
  },
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
  { path: '', redirectTo: 'cooperative/dashboard', pathMatch: 'full' },
];
