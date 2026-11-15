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
  // The roster of professionals of a cooperative, which the platform does not
  // serve yet; the supervision of each plot is the resource above.
  platformProviderTechnicalAdvisorsEndpointPath: '/technical-advisors',

  // Subscriptions and Payments
  demoCheckoutEnabled: false,
  platformProviderPlansEndpointPath: '/plans',
  platformProviderSubscriptionsEndpointPath: '/subscriptions',

  // Field Management
  platformProviderFieldPlotsEndpointPath: '/field-plots',
  platformProviderCropCampaignsEndpointPath: '/crop-campaigns',
  platformProviderCampaignLedgersEndpointPath: '/campaign-ledgers',

  // Crop Health
  // Clinical follow-up of a case; neither is served by the platform yet.
  platformProviderCaseAssessmentsEndpointPath: '/case-assessments',
  platformProviderTreatmentFollowUpsEndpointPath: '/treatment-follow-ups',
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
