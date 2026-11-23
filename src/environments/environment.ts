/** Build served by Firebase Hosting. The REST API runs on Render. */
export const environment = {
  production: true,
  platformProviderApiBaseUrl: 'https://sumaq-agro-platform.onrender.com/api/v1',

  // IAM
  platformProviderSignUpEndpointPath: '/users',
  platformProviderSignInEndpointPath: '/tokens',
  platformProviderPasswordRecoveryEndpointPath: '/authentication/password-recovery',

  // Profiles
  platformProviderProfilesEndpointPath: '/profiles',
  platformProviderCooperativesEndpointPath: '/cooperatives',
  platformProviderCooperativeMembersEndpointPath: '/cooperative-members',
  platformProviderAgronomistAssignmentsEndpointPath: '/agronomist-assignments',

  // Subscriptions and Payments
  demoCheckoutEnabled: false,
  platformProviderPlansEndpointPath: '/plans',
  platformProviderSubscriptionsEndpointPath: '/subscriptions',

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
  platformProviderPublicTraceabilityEndpointPath: '/public/traceability',
};
