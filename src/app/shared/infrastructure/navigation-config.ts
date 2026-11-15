import { UserRole } from '../../iam/domain/model/entities/user-role';

/** One option displayed in a role-specific side navigation menu. */
export interface NavigationOption {
  link: string;
  label: string;
  icon: string;
  /**
   * First segments this entry also stands for.
   *
   * @remarks
   * A page reached from this section but living outside its path, like the
   * inspections the producer opens from the inbox. The menu marks the entry
   * that owns the page instead of comparing the URL.
   */
  covers?: readonly string[];
}

/** A titled group of navigation options. */
export interface NavigationSection {
  title: string;
  options: NavigationOption[];
}

/** Navigation for an independent farmer. */
export const farmerNavigationSections: NavigationSection[] = [
  {
    title: 'section.major',
    options: [
      { link: '/dashboard', label: 'option.my-plot', icon: 'home' },
      { link: '/plots', label: 'farming.plots.manage', icon: 'grid_view' },
      // The campaign history is a list of its own, not a step inside a plot.
      { link: '/campaigns', label: 'farming.campaigns.title', icon: 'calendar_month' },
    ],
  },
  {
    title: 'section.agricultural-operation',
    options: [
      { link: '/monitoring', label: 'option.crop-health', icon: 'eco' },
      { link: '/finances', label: 'option.expenses', icon: 'payments' },
      // The same inbox the other roles open; only the name on the menu changes.
      {
        link: '/pest-reports',
        label: 'option.advisor',
        icon: 'forum',
        covers: ['inspections', 'prescriptions'],
      },
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
        icon: 'eco',
      },
      {
        link: '/certificates',
        label: 'option.cooperative-certificates',
        icon: 'workspace_premium',
      },
      { link: '/alerts', label: 'option.cooperative-alerts', icon: 'notification_important' },
      {
        link: '/pest-reports',
        label: 'option.diagnosis-inbox',
        icon: 'pest_control',
        covers: ['inspections', 'prescriptions'],
      },
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
    options: [{ link: '/subscriptions', label: 'subscriptions.nav-title', icon: 'credit_card' }],
  },
];

/** Returns navigation options supported by the session's active role. */
export function navigationFor(experience: UserRole): NavigationSection[] {
  if (experience === 'AGRONOMIST') return agronomistNavigationSections;
  return experience === 'COOPERATIVE_DIRECTOR'
    ? cooperativeDirectorNavigationSections
    : farmerNavigationSections;
}

/** Start page of each role: where its menu begins and where a denied route returns to. */
const homeRoutes: Record<UserRole, string> = {
  FARMER: '/dashboard',
  COOPERATIVE_DIRECTOR: '/cooperative/dashboard',
  AGRONOMIST: '/pest-reports',
};

/**
 * First segment of every route a role may open.
 *
 * @remarks
 * A role only reaches the pages its own menu leads to, plus their detail and
 * form routes. Opening any other page returns it to its own start page, so the
 * side menu always shows where the visitor is.
 */
const openableSegments: Record<UserRole, readonly string[]> = {
  FARMER: [
    'dashboard',
    'plots',
    'campaigns',
    'finances',
    'monitoring',
    'pest-reports',
    'inspections',
    'prescriptions',
    'certificates',
    'alerts',
    'subscriptions',
    'settings',
  ],
  COOPERATIVE_DIRECTOR: [
    'cooperative',
    'monitoring',
    'certificates',
    'alerts',
    'pest-reports',
    'inspections',
    'prescriptions',
    'subscriptions',
  ],
  AGRONOMIST: [
    'assigned-plots',
    'pest-reports',
    'inspections',
    'prescriptions',
    'monitoring',
    'alerts',
    'subscriptions',
    'settings',
  ],
};

/** Returns the start page of a role. */
export function homeRouteFor(experience: UserRole): string {
  return homeRoutes[experience] ?? homeRoutes.FARMER;
}

/**
 * Returns the menu entry a URL belongs to, or null when none does.
 *
 * @remarks
 * The longest matching link wins, so `/plots/3` marks "Manage plots" and not a
 * shorter entry. A page outside every path falls back to the entry that
 * declares its first segment in `covers`.
 *
 * @param experience - Role whose menu is on screen.
 * @param url - Current URL, with or without query string.
 */
export function activeNavigationLink(experience: UserRole, url: string): string | null {
  const options = navigationFor(experience).flatMap((section) => section.options);
  const path = url.split('?')[0].split('#')[0];
  const owner = options
    .filter((option) => path === option.link || path.startsWith(`${option.link}/`))
    .sort((first, second) => second.link.length - first.link.length)[0];

  if (owner) return owner.link;

  const segment = path.split('/')[1] ?? '';

  return options.find((option) => option.covers?.includes(segment))?.link ?? null;
}

/** Returns the account page of a role, the one its user menu opens. */
export function settingsRouteFor(experience: UserRole): string {
  return experience === 'COOPERATIVE_DIRECTOR' ? '/cooperative/settings' : '/settings';
}

/** Returns the first breadcrumb of a role: its own start page. */
export function homeCrumbFor(experience: UserRole): { label: string; link: string } {
  const home = homeRouteFor(experience);
  const option = navigationFor(experience)
    .flatMap((section) => section.options)
    .find((item) => item.link === home);

  return { label: option?.label ?? 'option.my-plot', link: home };
}

/**
 * Returns the wording a role's own menu gives to a route, or `null` when its
 * menu does not lead there.
 *
 * @param experience - Role of the visitor.
 * @param link - Route of the breadcrumb step.
 */
export function navigationLabelFor(experience: UserRole, link: string): string | null {
  return (
    navigationFor(experience)
      .flatMap((section) => section.options)
      .find((item) => item.link === link)?.label ?? null
  );
}

/**
 * Indicates whether a role may open a route.
 *
 * @param experience - Role of the visitor.
 * @param url - Route requested, with or without query parameters.
 */
export function roleCanOpen(experience: UserRole, url: string): boolean {
  const segment = url.split(/[?#]/)[0].split('/').filter(Boolean)[0];

  return segment === undefined || (openableSegments[experience] ?? []).includes(segment);
}
