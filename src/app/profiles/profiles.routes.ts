import { iamGuard } from '../iam/infrastructure/iam.guard';
import { Routes } from '@angular/router';

const farmerSettings = () =>
  import('./presentation/views/farmer-settings/farmer-settings').then(
    (module) => module.FarmerSettings,
  );
export const institutionalDashboard = () =>
  import('./presentation/views/institutional-dashboard/institutional-dashboard').then(
    (module) => module.InstitutionalDashboard,
  );
const cooperativeSettings = () =>
  import('./presentation/views/cooperative-settings/cooperative-settings').then(
    (module) => module.CooperativeSettings,
  );

/** Routes owned by the Profiles bounded context. */
export const profilesRoutes: Routes = [
  {
    path: 'settings',
    loadComponent: farmerSettings,
    title: 'profiles.settings.title',
  },
  {
    path: 'cooperative/registration',
    canActivate: [iamGuard],
    data: { roles: ['COOPERATIVE_DIRECTOR'] },
    loadComponent: () =>
      import('./presentation/views/cooperative-registration/cooperative-registration').then(
        (module) => module.CooperativeRegistration,
      ),
    title: 'profiles.cooperative.registration.title',
  },
  {
    path: 'cooperative/members',
    canActivate: [iamGuard],
    data: { roles: ['COOPERATIVE_DIRECTOR'] },
    loadComponent: () =>
      import('./presentation/views/cooperative-members/cooperative-members').then(
        (module) => module.CooperativeMembers,
      ),
    title: 'profiles.cooperative.members.title',
  },
  {
    path: 'cooperative/members/:id',
    canActivate: [iamGuard],
    data: { roles: ['COOPERATIVE_DIRECTOR'] },
    loadComponent: () =>
      import('./presentation/views/cooperative-members/cooperative-members').then(
        (module) => module.CooperativeMembers,
      ),
    title: 'profiles.cooperative.members.dossier',
  },
  {
    path: 'cooperative/settings',
    loadComponent: cooperativeSettings,
    title: 'profiles.cooperative.settings.title',
  },
];
