import { provideCharts, withDefaultRegisterables } from "ng2-charts";
import { Routes } from "@angular/router";
import { iamGuard } from "./iam/infrastructure/iam.guard";
import { roleGuard } from "./shared/infrastructure/role.guard";
import { activeSubscriptionGuard } from "./subscriptions/infrastructure/active-subscription.guard";

const iamRoutes = () =>
  import("./iam/iam.routes").then((m) => m.iamRoutes);

const layout = () =>
  import("./shared/presentation/components/layout/layout").then(
    (m) => m.Layout,
  );

const pageNotFound = () =>
  import("./shared/presentation/views/page-not-found/page-not-found").then(
    (m) => m.PageNotFound,
  );

const farmingRoutes = () =>
  import("./farming/farming.routes").then((m) => m.farmingRoutes);

const cropRoutes = () => import("./crop/crop.routes").then((m) => m.cropRoutes);

const profilesRoutes = () =>
  import("./profiles/profiles.routes").then((m) => m.profilesRoutes);

const certificationRoutes = () =>
  import("./certification/certification.routes").then(
    (m) => m.certificationRoutes,
  );

const subscriptionsRoutes = () =>
  import("./subscriptions/subscriptions.routes").then(
    (m) => m.subscriptionsRoutes,
  );

const publicTraceability = () =>
  import("./certification/presentation/views/public-traceability/public-traceability").then(
    (m) => m.PublicTraceability,
  );

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
  { path: "iam", loadChildren: iamRoutes },
  {
    path: "verify/:token",
    loadComponent: publicTraceability,
    title: "certification.trace.public-verification",
  },
  {
    path: "verify",
    loadComponent: publicTraceability,
    title: "certification.trace.public-verification",
  },
  { path: "", redirectTo: "/iam/sign-in", pathMatch: "full" },

  // Subscriptions: each of its pages chooses its own layout
  {
    path: "subscriptions",
    canActivate: [iamGuard],
    canActivateChild: [iamGuard],
    loadChildren: subscriptionsRoutes,
  },

  // Pages inside the shell
  {
    path: "",
    loadComponent: layout,
    canActivate: [iamGuard],
    canActivateChild: [iamGuard, roleGuard],
    children: [
      {
        path: "",
        canActivateChild: [activeSubscriptionGuard],
        children: [
          {
            path: "alerts",
            loadComponent: () =>
              import("./crop/crop.routes").then((m) => m.agriculturalAlerts()),
            title: "crop.alerts-title",
          },
          { path: "certificates", loadChildren: certificationRoutes },
          {
            path: "dashboard",
            providers: [provideCharts(withDefaultRegisterables())],
            loadComponent: () =>
              import("./farming/farming.routes").then((m) =>
                m.myPlotDashboard(),
              ),
            title: "option.my-plot",
          },
          {
            path: "cooperative/dashboard",
            providers: [provideCharts(withDefaultRegisterables())],
            loadComponent: () =>
              import("./profiles/profiles.routes").then((m) =>
                m.institutionalDashboard(),
              ),
            title: "profiles.cooperative.dashboard.tab-title",
          },
          { path: "", loadChildren: farmingRoutes },
          { path: "", loadChildren: cropRoutes },
          { path: "", loadChildren: profilesRoutes },
        ],
      },
      {
        path: "**",
        loadComponent: pageNotFound,
        title: "page-not-found.title",
      },
    ],
  },
];
