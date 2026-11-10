/**
 * Production environment.
 *
 * @remarks
 * Points to the fake API (json-server with `server/db.json`) deployed on Render,
 * until the RESTful API is deployed.
 */
export const environment = {
  production: true,
  /*
  // API URL version to use when the SumaqAgro RESTful API is deployed
  platformProviderApiBaseUrl: 'https://sumaqagro-api.example.com/api/v1',
  */
  // API URL version to use until the SumaqAgro RESTful API is deployed
  platformProviderApiBaseUrl: 'https://sumaqagro-fake-api.onrender.com/api/v1',

  // IAM
  platformProviderSignUpEndpointPath: '/authentication/sign-up',
  platformProviderSignInEndpointPath: '/authentication/sign-in',
  platformProviderPasswordRecoveryEndpointPath: '/authentication/password-recovery',
  useMockAuthentication: false,

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
