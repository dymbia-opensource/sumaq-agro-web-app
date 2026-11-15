import { iamGuard } from '../iam/infrastructure/iam.guard';
import { Routes } from '@angular/router';

const cropHealth = () =>
  import('./presentation/views/crop-health/crop-health').then((m) => m.CropHealth);

export const agriculturalAlerts = () =>
  import('./presentation/views/agricultural-alerts/agricultural-alerts').then(
    (m) => m.AgriculturalAlerts,
  );

export const diagnosisInbox = () =>
  import('./presentation/views/diagnosis-inbox/diagnosis-inbox').then(
    (m) => m.DiagnosisInbox,
  );

const fieldInspections = () =>
  import('./presentation/views/field-inspections/field-inspections').then(
    (m) => m.FieldInspections,
  );

const prescriptions = () =>
  import('./presentation/views/prescriptions/prescriptions').then(
    (m) => m.Prescriptions,
  );

const pestReportForm = () =>
  import('./presentation/views/pest-report-form/pest-report-form').then((m) => m.PestReportForm);

const prescriptionForm = () =>
  import('./presentation/views/prescription-form/prescription-form').then(
    (m) => m.PrescriptionForm,
  );

/**
 * Routes of the Crop bounded context.
 */
export const cropRoutes: Routes = [
  {
    path: '',
    canActivate: [iamGuard],
    canActivateChild: [iamGuard],
    children: [
      {
        path: 'assigned-plots',
        data: { roles: ['AGRONOMIST'] },
        loadComponent: () =>
          import('./presentation/views/advisor-plots/advisor-plots').then(
            (m) => m.AdvisorPlots,
          ),
        title: 'option.assigned-plots',
      },
      {
        path: 'monitoring',
        loadComponent: cropHealth,
        title: 'option.crop-health',
      },
      {
        path: 'pest-reports',
        loadComponent: diagnosisInbox,
        title: 'option.diagnosis-inbox',
      },
      // US-49 and US-51 open both screens to the producer as well, who
      // reaches them from the inbox.
      {
        path: 'inspections',
        loadComponent: fieldInspections,
        title: 'crop.inspections-title',
      },
      {
        path: 'prescriptions',
        loadComponent: prescriptions,
        title: 'crop.history-title',
      },
      {
        path: 'pest-reports/new',
        data: { roles: ['FARMER'] },
        loadComponent: pestReportForm,
        title: 'crop.form-title',
      },
      {
        path: 'pest-reports/:id',
        loadComponent: () =>
          import('./presentation/views/farmer-case/farmer-case').then(
            (m) => m.FarmerCase,
          ),
        title: 'crop.case.title',
      },
      {
        path: 'prescriptions/new',
        data: { roles: ['AGRONOMIST'] },
        loadComponent: prescriptionForm,
        title: 'crop.prescribe-title',
      },
      // What a report motivates hangs from the report, so the trail of the URL
      // is the trail of the case and the menu marks the inbox without help.
      {
        path: 'pest-reports/:reportId/inspections',
        loadComponent: fieldInspections,
        title: 'crop.inspections-title',
      },
      {
        path: 'pest-reports/:reportId/prescriptions/new',
        data: { roles: ['AGRONOMIST'] },
        loadComponent: prescriptionForm,
        title: 'crop.prescribe-title',
      },
    ],
  },
];
