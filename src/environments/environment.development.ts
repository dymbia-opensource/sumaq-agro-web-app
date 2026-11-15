/**
 * Development environment.
 *
 * @remarks
 * Points to the local Spring Boot API.
 */
export const environment = {
  production: false,
  platformProviderApiBaseUrl: 'http://localhost:8080/api/v1',

  // IAM
  platformProviderSignUpEndpointPath: '/users',
  platformProviderSignInEndpointPath: '/tokens',
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
  demoCheckoutEnabled: true,
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
