import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ExpenseCategory } from './domain/model/entities/expense-entry.entity';

export const myPlotDashboardView = () =>
  import('./presentation/views/my-plot-dashboard-view/my-plot-dashboard-view').then(
    (m) => m.MyPlotDashboardView,
  );
const registeredPlotsView = () =>
  import('./presentation/views/registered-plots-view/registered-plots-view').then(
    (m) => m.RegisteredPlotsView,
  );
const plotRegistrationView = () =>
  import('./presentation/views/plot-registration-view/plot-registration-view').then(
    (m) => m.PlotRegistrationView,
  );
const plotBoundaryMapView = () =>
  import('./presentation/views/plot-boundary-map-view/plot-boundary-map-view').then(
    (m) => m.PlotBoundaryMapView,
  );

const plotDetailView = () =>
  import('./presentation/views/plot-detail-view/plot-detail-view').then((m) => m.PlotDetailView);
const soilBaselineView = () =>
  import('./presentation/views/soil-baseline-view/soil-baseline-view').then(
    (m) => m.SoilBaselineView,
  );
const campaignHistoryView = () =>
  import('./presentation/views/campaign-history-view/campaign-history-view').then(
    (m) => m.CampaignHistoryView,
  );
const campaignStartView = () =>
  import('./presentation/views/campaign-start-view/campaign-start-view').then(
    (m) => m.CampaignStartView,
  );
const costReportsView = () =>
  import('./presentation/views/cost-reports-view/cost-reports-view').then(
    (m) => m.CostReportsView,
  );

const campaignFinancesView = () =>
  import('./presentation/views/campaign-finances-view/campaign-finances-view').then(
    (m) => m.CampaignFinancesView,
  );
const fieldExpenseView = () =>
  import('./presentation/views/field-expense-view/field-expense-view').then(
    (m) => m.FieldExpenseView,
  );

const baseTitle = 'SumaqAgro';

/**
 * Route tree for the Field Management views (lazy loaded under `/field-management`).
 *
 * @remarks
 * Chart.js is provided here, so it is only downloaded when the user opens
 * this context.
 */
export const fieldManagementRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
    children: [
      { path: 'plots', loadComponent: registeredPlotsView, title: `My Plots – ${baseTitle}` },
      {
        path: 'plots/new',
        loadComponent: plotRegistrationView,
        title: `Register a Plot – ${baseTitle}`,
      },
      {
        path: 'plots/:id/boundary',
        loadComponent: plotBoundaryMapView,
        title: `Delineate the Plot – ${baseTitle}`,
      },
      { path: 'plots/:id', loadComponent: plotDetailView, title: `Plot Detail – ${baseTitle}` },
      {
        path: 'plots/:id/soil',
        loadComponent: soilBaselineView,
        title: `Soil Analysis – ${baseTitle}`,
      },
      { path: 'campaigns', loadComponent: campaignHistoryView, title: `My Campaigns – ${baseTitle}` },
      {
        path: 'campaigns/new',
        loadComponent: campaignStartView,
        title: `Start a Campaign – ${baseTitle}`,
      },
      { path: 'finances', loadComponent: campaignFinancesView, title: `My Expenses – ${baseTitle}` },
      {
        path: 'finances/reports',
        loadComponent: costReportsView,
        title: `Cost Reports – ${baseTitle}`,
      },
      // One route per expense type; `data.category` reaches the view as an input.
      {
        path: 'finances/expenses/new/inputs',
        loadComponent: fieldExpenseView,
        data: { category: ExpenseCategory.INPUTS },
        title: `Register an Input Expense – ${baseTitle}`,
      },
      {
        path: 'finances/expenses/new/labor',
        loadComponent: fieldExpenseView,
        data: { category: ExpenseCategory.LABOR },
        title: `Register a Labor Expense – ${baseTitle}`,
      },
      {
        path: 'finances/expenses/new/freight',
        loadComponent: fieldExpenseView,
        data: { category: ExpenseCategory.FREIGHT },
        title: `Register a Freight Expense – ${baseTitle}`,
      },
      { path: 'finances/expenses/new', redirectTo: 'finances/expenses/new/inputs', pathMatch: 'full' },
    ],
  },
];
