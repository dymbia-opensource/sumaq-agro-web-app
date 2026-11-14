import { iamGuard } from '../iam/infrastructure/iam.guard';
import { Routes } from '@angular/router';

const cropHealthView = () =>
  import('./presentation/views/crop-health-view/crop-health-view').then((m) => m.CropHealthView);

export const agriculturalAlertsView = () =>
  import('./presentation/views/agricultural-alerts-view/agricultural-alerts-view').then(
    (m) => m.AgriculturalAlertsView,
  );

export const diagnosisInboxView = () =>
  import('./presentation/views/diagnosis-inbox-view/diagnosis-inbox-view').then(
    (m) => m.DiagnosisInboxView,
  );

const fieldInspectionsView = () =>
  import('./presentation/views/field-inspections-view/field-inspections-view').then(
    (m) => m.FieldInspectionsView,
  );

const prescriptionsView = () =>
  import('./presentation/views/prescriptions-view/prescriptions-view').then(
    (m) => m.PrescriptionsView,
  );

const pestReportForm = () =>
  import('./presentation/views/pest-report-form/pest-report-form').then((m) => m.PestReportForm);

const prescriptionForm = () =>
  import('./presentation/views/prescription-form/prescription-form').then(
    (m) => m.PrescriptionForm,
  );

/**
 * Routes of the Crop Health bounded context (lazy loaded under `/crop-health`).
 */
export const cropHealthRoutes: Routes = [
  {
    path: '',
    canActivate: [iamGuard],
    canActivateChild: [iamGuard],
    children: [
      {
        path: 'assigned-plots',
        data: { roles: ['AGRONOMIST'] },
        loadComponent: () =>
          import('./presentation/views/advisor-plots-view/advisor-plots-view').then(
            (m) => m.AdvisorPlotsView,
          ),
        title: 'Assigned plots – SumaqAgro',
      },
      {
        path: 'monitoring',
        loadComponent: cropHealthView,
        title: 'Crop Health – SumaqAgro | Multispectral Satellite Viewer',
      },
      {
        path: 'pest-reports',
        loadComponent: diagnosisInboxView,
        title: 'Diagnosis Inbox – SumaqAgro',
      },
      {
        path: 'inspections',
        loadComponent: fieldInspectionsView,
        title: 'Field Inspections – SumaqAgro',
      },
      {
        path: 'prescriptions',
        loadComponent: prescriptionsView,
        title: 'Prescriptions History – SumaqAgro',
      },
      {
        path: 'pest-reports/new',
        data: { roles: ['FARMER'] },
        loadComponent: pestReportForm,
        title: 'Report Pest or Disease – SumaqAgro',
      },
      {
        path: 'pest-reports/:id',
        loadComponent: () =>
          import('./presentation/views/farmer-case-view/farmer-case-view').then(
            (m) => m.FarmerCaseView,
          ),
        title: 'Incident follow-up – SumaqAgro',
      },
      {
        path: 'prescriptions/new',
        data: { roles: ['AGRONOMIST'] },
        loadComponent: prescriptionForm,
        title: 'Issue Technical Prescription – SumaqAgro',
      },
    ],
  },
];
