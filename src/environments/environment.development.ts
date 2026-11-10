/**
 * Development environment.
 *
 * @remarks
 * Points to the json-server fake API (`server/db.json`) running on port 3000.
 */
export const environment = {
  production: false,
  platformProviderApiBaseUrl: 'http://localhost:3000/api/v1',

  // IAM
  platformProviderSignUpEndpointPath: '/authentication/sign-up',
  platformProviderSignInEndpointPath: '/authentication/sign-in',
  platformProviderPasswordRecoveryEndpointPath: '/authentication/password-recovery',
  useMockAuthentication: true,

  // Profiles
  platformProviderProfilesEndpointPath: '/profiles',
  platformProviderCooperativesEndpointPath: '/cooperatives',
  platformProviderCooperativeMembersEndpointPath: '/cooperative-members',
  platformProviderAgronomistAssignmentsEndpointPath: '/agronomist-assignments',

  // Subscriptions and Payments
  useMockSubscriptionPayments: true,
  platformProviderPlansEndpointPath: '/plans',
  platformProviderSubscriptionsEndpointPath: '/subscriptions',
  platformProviderPaymentsEndpointPath: '/payments',

  // Field Management
  platformProviderFieldPlotsEndpointPath: '/field-plots',
  platformProviderCropCampaignsEndpointPath: '/crop-campaigns',
  platformProviderCampaignLedgersEndpointPath: '/campaign-ledgers',

  // Crop Health
  platformProviderSatelliteObservationsEndpointPath: '/satellite-observations',
  platformProviderClimateForecastsEndpointPath: '/climate-forecasts',
  platformProviderAgroclimaticAlertsEndpointPath: '/agroclimatic-alerts',
  platformProviderRegionalBulletinsEndpointPath: '/regional-bulletins',
  platformProviderPestReportsEndpointPath: '/pest-reports',
  platformProviderFieldInspectionsEndpointPath: '/field-inspections',
  platformProviderTechnicalPrescriptionsEndpointPath: '/technical-prescriptions',

  // Harvest Certification
  platformProviderHarvestBatchesEndpointPath: '/harvest-batches',
  platformProviderQualityCertificatesEndpointPath: '/quality-certificates',
  platformProviderPublicTraceabilityEndpointPath: '/public-traceability',
};
