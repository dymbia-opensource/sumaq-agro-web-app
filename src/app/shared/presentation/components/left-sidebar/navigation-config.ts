/** One option displayed in a role-specific side navigation menu. */
export interface NavigationOption {
  link: string;
  label: string;
  icon: string;
}

/** A titled group of navigation options. */
export interface NavigationSection {
  title: string;
  options: NavigationOption[];
}

/** Experiences currently supported by the web application. */
import { UserRole } from '../../../../iam/domain/model/value-objects/user-role';

/** Navigation for an independent farmer. */
export const farmerNavigationSections: NavigationSection[] = [
  {
    title: 'section.major',
    options: [{ link: '/dashboard', label: 'option.my-plot', icon: 'home' }],
  },
  {
    title: 'section.agricultural-operation',
    options: [
      { link: '/monitoring', label: 'option.crop-health', icon: 'eco' },
      { link: '/finances', label: 'option.expenses', icon: 'payments' },
      { link: '/advisor', label: 'option.advisor', icon: 'forum' },
      {
        link: '/certificates',
        label: 'option.harvest-certificates',
        icon: 'workspace_premium',
      },
    ],
  },
  {
    title: 'section.system',
    options: [
      { link: '/alerts', label: 'option.alerts', icon: 'notification_important' },
      { link: '/subscriptions', label: 'subscriptions.nav-title', icon: 'credit_card' },
      { link: '/settings', label: 'option.settings', icon: 'settings' },
    ],
  },
];

/** Navigation for the director who manages a cooperative. */
export const cooperativeDirectorNavigationSections: NavigationSection[] = [
  {
    title: 'section.institutional-management',
    options: [
      {
        link: '/cooperative/dashboard',
        label: 'option.cooperative-dashboard',
        icon: 'home',
      },
      { link: '/cooperative/members', label: 'option.member-directory', icon: 'group' },
      {
        link: '/monitoring',
        label: 'option.cooperative-plot-health',
        icon: 'description',
      },
      {
        link: '/finances',
        label: 'option.cooperative-costs',
        icon: 'calendar_month',
      },
      {
        link: '/certificates',
        label: 'option.cooperative-certificates',
        icon: 'calendar_month',
      },
      { link: '/alerts', label: 'option.cooperative-alerts', icon: 'calendar_month' },
      { link: '/pest-reports', label: 'option.diagnosis-inbox', icon: 'pest_control' },
    ],
  },
  {
    title: 'section.system',
    options: [
      { link: '/subscriptions', label: 'subscriptions.nav-title', icon: 'credit_card' },
      {
        link: '/cooperative/settings',
        label: 'option.cooperative-settings',
        icon: 'settings',
      },
    ],
  },
];

export const agronomistNavigationSections: NavigationSection[] = [
  {
    title: 'section.agricultural-operation',
    options: [
      { link: '/assigned-plots', label: 'option.assigned-plots', icon: 'map' },
      { link: '/pest-reports', label: 'option.diagnosis-inbox', icon: 'pest_control' },
      {
        link: '/inspections',
        label: 'option.field-inspections',
        icon: 'travel_explore',
      },
      { link: '/prescriptions', label: 'option.prescriptions', icon: 'medication' },
      { link: '/monitoring', label: 'option.crop-health', icon: 'eco' },
      { link: '/alerts', label: 'option.alerts', icon: 'warning' },
    ],
  },
  {
    title: 'section.system',
    options: [
      { link: '/subscriptions', label: 'subscriptions.nav-title', icon: 'credit_card' },
    ],
  },
];

/** Returns navigation options supported by the session's active role. */
export function navigationFor(experience: UserRole): NavigationSection[] {
  if (experience === 'AGRONOMIST') return agronomistNavigationSections;
  return experience === 'COOPERATIVE_DIRECTOR'
    ? cooperativeDirectorNavigationSections
    : farmerNavigationSections;
}
