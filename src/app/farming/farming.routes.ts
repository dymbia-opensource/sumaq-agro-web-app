import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const myPlotDashboard = () =>
  import('./presentation/views/my-plot-dashboard/my-plot-dashboard').then((m) => m.MyPlotDashboard);
const registeredPlots = () =>
  import('./presentation/views/registered-plots/registered-plots').then((m) => m.RegisteredPlots);
const plotRegistration = () =>
  import('./presentation/views/plot-registration/plot-registration').then(
    (m) => m.PlotRegistration,
  );
const plotBoundary = () =>
  import('./presentation/views/plot-boundary/plot-boundary').then((m) => m.PlotBoundary);

const plotDetail = () =>
  import('./presentation/views/plot-detail/plot-detail').then((m) => m.PlotDetail);
const soilAnalysis = () =>
  import('./presentation/views/soil-analysis/soil-analysis').then((m) => m.SoilAnalysis);
const campaignHistory = () =>
  import('./presentation/views/campaign-history/campaign-history').then((m) => m.CampaignHistory);
const campaignStart = () =>
  import('./presentation/views/campaign-start/campaign-start').then((m) => m.CampaignStart);
const financePending = () =>
  import('./presentation/views/finance-pending/finance-pending').then((m) => m.FinancePending);

/**
 * Route tree for the Farming views.
 *
 * @remarks
 * Chart.js is provided here, so it is only downloaded when the user opens
 * this context.
 */
export const farmingRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
    children: [
      { path: 'plots', loadComponent: registeredPlots, title: 'farming.plots.title' },
      {
        path: 'plots/new',
        loadComponent: plotRegistration,
        title: 'farming.plot-form.tab-title',
      },
      {
        path: 'plots/:id/boundary',
        loadComponent: plotBoundary,
        title: 'farming.boundary.title',
      },
      { path: 'plots/:id', loadComponent: plotDetail, title: 'farming.plot-detail.title' },
      {
        path: 'plots/:id/soil',
        loadComponent: soilAnalysis,
        title: 'farming.soil.title',
      },
      {
        path: 'campaigns',
        loadComponent: campaignHistory,
        title: 'farming.campaigns.title',
      },
      {
        path: 'campaigns/new',
        loadComponent: campaignStart,
        title: 'farming.campaigns.new',
      },
      { path: 'finances', loadComponent: financePending, title: 'option.expenses' },
      { path: 'finances/reports', loadComponent: financePending, title: 'farming.reports.title' },
      { path: 'finances/expenses/new', redirectTo: 'finances', pathMatch: 'full' },
      { path: 'finances/expenses/new/:category', redirectTo: 'finances' },
    ],
  },
];
