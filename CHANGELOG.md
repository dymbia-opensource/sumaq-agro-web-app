# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2026-11-23

Adapts the Web Application to the SumaqAgro Platform v1.1.0 and polishes the user experience of the three customer segments.

### Added
- **Subscriptions**: payment with Mercado Pago Checkout Pro and a payment result page that confirms the subscription.
- **Farming**: expenses and actual yield recorded through the campaign ledger endpoints of the platform; finance pages and campaign figures available again.
- **Crop**: import of the climate forecast from the platform.
- **Certification**: loading indicator and translated quality categories.
- **Theme**: SumaqAgro palette generated with Angular Material from the brand colors (field green and harvest gold).

### Changed
- **IAM**: follows the learning-center layout while keeping the DDD subfolders; the interceptor only adds the bearer token and sign-in/sign-out no longer depend on the router.
- **Certification**: rebuilt with DDD: entities, commands, endpoints, requests, responses, assemblers and a `CertificationStore`.
- **Farming**: the cost report PDF is built in the infrastructure layer and translated to the selected language.
- **Navigation**: pages opened from the side menu no longer show a breadcrumb, page titles match the menu labels, every role shares the same names for the shared pages, and the logo opens the start page of the signed-in role.
- **Agronomist**: the diagnosis inbox opens the menu, assigned plots show status badges, and "My profile" shows the account of the agronomist instead of the farmer one.
- **Layout**: the side menu can be collapsed on desktop, the sign-out button is quieter, and the connection chip explains the offline mode.
- **Internationalization**: cooperative settings, domain errors of Profiles and the cost report are translated into English and Spanish.

### Removed
- Legacy routes, redirects, fake API files and the unused endpoints of the previous contract.
- Unused advisor and delete confirmation dialogs of the cooperative settings.

### Fixed
- Translations not loading because of a circular dependency in the IAM interceptor.
- Farmer profile updated with `PATCH`, as the platform expects.
- Certificate documents retrieved and downloaded by id.

## [2.0.0] - 2026-11-15

The SumaqAgro Web Application now works with real data from the SumaqAgro Platform (Spring Boot) instead of the fake API.

### Added
- **IAM**: sign-in, sign-up with profile names and password confirmation, password recovery, session expiration, authentication guard and interceptor, language switching on the auth pages.
- **Subscriptions**: plans catalog restricted by customer segment, checkout, billing history and cancellation; the workspace requires an active subscription and the plot quota comes from the plan.
- **Profiles**: cooperative registration, member registry with filters and member dossiers, advisor assignment per plot, inline account editing, account settings and help manuals.
- **Crop**: assigned plots view for the agronomist, farmer case view and advisory panel, regional bulletins.
- **Farming**: campaigns, plot detail, soil analysis, cost report PDF and the offline expense queue.
- **Certification**: certificate printing.
- **Shared**: plot search with autocomplete in the toolbar and the active section marked in the side menu.

### Changed
- Data now comes from the platform REST API on Render.
- Bounded contexts renamed: `field-management` → `farming`, `crop-health` → `crop`, `harvest-certification` → `certification`; routes no longer use those prefixes.
- `Money` moved to the shared kernel and `LayoutService` renamed to `LayoutStore`.

### Removed
- Notifications button, demo coupons and payment components, and the free plan.

## [1.0.1] - 2026-10-09

### Added
- **Contributing Guidelines**: Added `CONTRIBUTING.md` with the DDD layers and dependency rules of each bounded context, Git Flow branch naming, Conventional Commits scopes, SemVer, Angular and Angular Material standards, i18n rules, fake API usage and the pull request checklist.
- **Changelog**: Added this `CHANGELOG.md` following Keep a Changelog.

## [1.0.0] - 2026-10-09

First version of the SumaqAgro Web Application, deployed on Firebase Hosting with data served by a fake API (json-server) on Render.

### Added
- **Shared Kernel**:
  - Domain base classes `BaseEntity` and the `Money` value object.
  - Infrastructure base classes: `BaseResource`, `BaseResponse`, `BaseAssembler`, `ErrorHandlingEnabledBaseType`, `BaseApi` and the generic `BaseApiEndpoint` with filtered queries (`getAllBy`), plus `api-date` helpers for `YYYY-MM-DD` dates.
  - Layout shell split into `Layout`, `LeftSidebar` (navigation by role) and `Toolbar`, with `LayoutService` for the responsive side menu.
  - `DemoSessionService` and the **Demo Access** view to choose a farmer, cooperative director or agronomist until IAM is implemented, and `PlotSelectionService` to share the selected plot between contexts.
  - Reusable presentation components `PageHeader` (breadcrumb, title and subtitle) and `MessageCard` (error and empty states), plus `LanguageSwitcher` and `PageNotFound`.
  - Material 3 green theme, Poppins font and Material Symbols icons.
- **Field Management Bounded Context**:
  - Domain model: `FieldPlot` (GPS polygon, area in hectares and crossed-sides validation), `CropCampaign`, `CampaignLedger` (total investment, cost by category, breakeven and suggested price) and `ExpenseEntry`, the `GeoCoordinate` value object, enums and commands.
  - `FieldManagementStore` (single store with signals) and `FieldManagementApi` with endpoints and assemblers for plots, campaigns and cost ledgers.
  - "My Plot" dashboard with KPI cards, NDVI evolution chart and cost distribution chart.
  - Registered plots view with plot cards and free plan slots (US-22, US-28).
  - Two-step plot registration: crop data form and satellite map (Leaflet) to delineate the polygon (US-29 to US-34).
  - Campaign finances view (US-36, US-40) and field expense form with one route per expense type: inputs, labor and freight (US-37 to US-39).
- **Crop Health Bounded Context**:
  - Entities `SatelliteObservation`, `ClimateForecast`, `AgroclimaticAlert`, `PestReport`, `FieldInspection` and `TechnicalPrescription` with their commands, assemblers, endpoints, `CropHealthApi` and `CropHealthStore`.
  - Crop health monitoring view with a Leaflet map (NDVI/NDWI layers), plot selector and observation image download.
  - Agroclimatic alerts view, pest report form, diagnosis inbox, field inspections, prescription form and prescriptions view, connected to the fake API and filtered by role.
- **Profiles Bounded Context**:
  - Entities `FarmerProfile`, `Cooperative`, `CooperativeMember`, `TechnicalAdvisor` and `CooperativeDashboard` with `ProfilesApi` and `ProfilesStore`.
  - Farmer settings view, cooperative director dashboard and cooperative institutional settings with the technical team of agronomists.
- **Harvest Certification Bounded Context**:
  - Entities `HarvestBatch`, `RepresentativeSample`, `PotatoCaliberGrading`, `CoffeeCuppingResult`, `QualityCertificate` and `PublicTraceabilityRecord` with `HarvestCertificationApi` and `HarvestCertificationStore`.
  - Harvest certificates view, batch registration, grading sheet and the farmer certificate view with QR code.
  - Public traceability view (`/verify/:token`) that verifies a certificate without an account.
- **Internationalization (i18n)**: English and Spanish translations split by bounded context (`public/i18n/{en,es}/<context>.json`) with `MultiTranslateHttpLoader`, translated paginator labels and English as the default language.
- **Fake API & Deployment**: json-server data and routes (`/api/v1`) for every bounded context, production environment pointing to Render, and Firebase Hosting configuration.
- **Documentation**: README with setup, run and deploy instructions, and PlantUML class diagrams of the Web Application and the RESTful API for every bounded context in `docs/`.

### Changed
- **Field Management Presentation**: Split large views into small presentation components (`PlotCard`, `PlotSlotCard`, `RegistrationSteps`, `PlotRegistrationForm`, `PlotBoundaryMap`, `BoundarySummaryPanel`, `PlotSavedDialog`, `CampaignKpiCards`, `NdviChartCard`, `CostDistributionCard`), renamed the registration page to `PlotRegistrationView`, and moved the NDVI loading from the dashboard view into `FieldManagementStore`.
- **Field Management Domain**: `CampaignLedger` now creates its own expenses from the expense commands, and `GeoCoordinate` is named as a value object (`geo-coordinate.ts`).
- **Crop Health**: Replaced fabricated fallback data with explicit loading, empty and error states, and enhanced the dashboard with satellite observation data.
- **Demo Access**: Texts updated to English, and the active user now comes from the demo access instead of a fixed environment user.

### Removed
- Unused `SoilBaseline` value object and `RecordSoilBaselineCommand` from the Web Application (soil analysis, US-31, remains in the design for a future version).
- Report download from Crop Health, replaced by the observation image download.
- Cooperative registration flow from Profiles.

### Fixed
- Translations, fake API data and routes lost in the Crop Health merge.
- Crop Health map initialization.
- Harvest certification routes and the quality filter translation key.
- Cooperative dashboard and institutional settings loaded for the selected user.
- Missing list responses of the Field Management infrastructure.

[Unreleased]: https://github.com/dymbia-opensource/sumaq-agro-web-app/compare/v2.1.0...develop
[2.1.0]: https://github.com/dymbia-opensource/sumaq-agro-web-app/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/dymbia-opensource/sumaq-agro-web-app/compare/v1.0.1...v2.0.0
[1.0.1]: https://github.com/dymbia-opensource/sumaq-agro-web-app/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/dymbia-opensource/sumaq-agro-web-app/releases/tag/v1.0.0
