# SumaqAgro Web Application User Stories

## Overview
This document presents the functional requirement user stories implemented by the SumaqAgro web application (Angular 22). The requirements are organized around the bounded contexts of the platform: **Identity and Access Management (IAM)**, **Profiles**, **Subscriptions and Payments**, **Field Management**, **Crop Health**, **Harvest Certification**, and **Shared Capabilities**. Story identifiers match the product backlog of the project report (chapter 3).

Roles involved:
- **Agricultural Producer** (`FARMER`): Registers plots, campaigns, and expenses, monitors crop health, and reports pests.
- **Cooperative Director** (`COOPERATIVE_DIRECTOR`): Manages the cooperative, its member registry and technical team, and certifies harvest batches.
- **Technical Field Advisor** (`AGRONOMIST`): Attends pest reports, schedules inspections, issues prescriptions, and publishes regional bulletins.
- **Registered User**: Any authenticated user, regardless of role.
- **Visitor / Guest**: Unauthenticated user, e.g., a buyer verifying a certificate by QR code.

---

## Requirement Traceability Matrix (RTM)

| User Story ID | Title | Bounded Context | Related Implementation Elements |
|---------------|-------|-----------------|---------------------------------|
| **US-10** | User Registration (Sign Up) | IAM | `SignUpCommand`, `SignUpAssembler`, `SignUpApiEndpoint`, `IamApi`, `IamStore`, `SignUpForm` |
| **US-11** | Secure Sign In | IAM | `SignInCommand`, `User`, `SignInAssembler`, `SignInApiEndpoint`, `IamApi`, `IamStore`, `SignInForm`, `iamInterceptor`, `iamGuard` |
| **US-12** | Plans Catalog during Onboarding | Subscriptions | `Plan`, `PlanAssembler`, `PlansApiEndpoint`, `SubscriptionsApi`, `SubscriptionsStore`, `PlansCatalog`, `PlanCard` |
| **US-13** | Forgotten Password Recovery | IAM | `RequestPasswordResetCommand`, `ResetPasswordCommand`, `PasswordRecoveryAssembler`, `PasswordRecoveryApiEndpoint`, `IamStore`, `ForgotPasswordForm`, `ResetPasswordForm` |
| **US-14** | Secure Sign Out | IAM | `IamStore`, `Toolbar`, `LeftSidebar`, `SubscriptionsShell` |
| **US-16** | Profile and Contact Data Update | Profiles | `FarmerProfile`, `UpdateFarmerAccountCommand`, `FarmerProfileAssembler`, `FarmerProfilesApiEndpoint`, `ProfilesStore`, `FarmerSettings` |
| **US-17** | Cooperative Registration | Profiles | `Cooperative`, `UpdateCooperativeCommand`, `CooperativeAssembler`, `CooperativesApiEndpoint`, `ProfilesStore`, `CooperativeRegistration`, `CooperativeSettings` |
| **US-18** | Add Members to the Cooperative Registry | Profiles | `CooperativeMember`, `MemberCandidate`, `CooperativeMemberAssembler`, `MemberCandidateAssembler`, `CooperativeMembersApiEndpoint`, `ProfilesStore`, `CooperativeMembers` |
| **US-19** | Invite Agronomists | Profiles | `AgronomistInvitation`, `TechnicalAdvisor`, `AgronomistInvitationAssembler`, `CooperativesApiEndpoint`, `ProfilesStore`, `CooperativeSettings` |
| **US-20** | Assign Agronomists to Member Plots | Profiles | `PlotAdvisorAssignment`, `AdvisorAssignmentHistory`, `PlotAdvisorAssignmentAssembler`, `PlotAdvisorAssignmentsApiEndpoint`, `ProfilesStore`, `PlotAdvisorAssignment` (component) |
| **US-21** | Consolidated Member and Plot Directory | Profiles | `CooperativeMember`, `MemberPlot`, `ProfilesStore`, `InstitutionalDashboard`, `CooperativeMembers` |
| **US-22** | Plot Quota by Plan | Subscriptions / Field Management | `Plan`, `Subscription`, `FarmingStore` (`setPlanPlotQuota`), `PlotQuotaSummary`, `PlotSlotCard`, `activeSubscriptionGuard` |
| **US-23** | Paid Plan Selection | Subscriptions | `SelectSubscriptionPlanCommand`, `PlanCode`, `BillingCycle`, `SubscriptionsStore`, `PlansCatalog`, `PlanCard` |
| **US-24** | Secure Card Payment (Mercado Pago) | Subscriptions | `StartPaymentCheckoutCommand`, `PaymentCheckout`, `PaymentCheckoutAssembler`, `SubscriptionsApiEndpoint`, `SubscriptionsStore`, `Checkout` |
| **US-25** | Membership Activation | Subscriptions | `ConfirmPaymentCommand`, `Payment`, `Subscription`, `PaymentAssembler`, `SubscriptionAssembler`, `SubscriptionsStore`, `PaymentResult` |
| **US-26** | Cancel an Active Subscription | Subscriptions | `CancelSubscriptionCommand`, `Subscription`, `SubscriptionsStore`, `BillingHistory` |
| **US-27** | Billing History and Receipts | Subscriptions | `Payment`, `PaymentsApiEndpoint`, `SubscriptionsApi` (`buildReceipt`), `FileDownloader`, `SubscriptionsStore`, `BillingHistory` |
| **US-28** | Plot Registration | Field Management | `RegisterFieldPlotCommand`, `FieldPlot`, `FieldPlotAssembler`, `FieldPlotsApiEndpoint`, `FarmingStore`, `PlotRegistration`, `PlotRegistrationForm`, `PlotSavedDialog` |
| **US-29** | Polygon Delineation with GPS Coordinates | Field Management | `DelineatePlotBoundaryCommand`, `GeoCoordinate`, `FarmingStore`, `PlotBoundary`, `PlotBoundaryMap`, `BoundarySummaryPanel` |
| **US-30** | Interactive Plot Map | Field Management | `FieldPlot`, `PlotDetail`, `PlotPolygonViewer`, `PlotCadastreCard`, `RegisteredPlots`, `PlotCard` |
| **US-31** | Soil Analysis Baseline | Field Management | `RecordSoilBaselineCommand`, `SoilBaseline`, `SoilTexture`, `FarmingStore`, `SoilAnalysis`, `SoilBaselineForm`, `SoilBaselineCard` |
| **US-32** | Open a Crop Campaign | Field Management | `StartCropCampaignCommand`, `RecordSowingDateCommand`, `CropCampaign`, `CropCampaignAssembler`, `CropCampaignsApiEndpoint`, `FarmingStore`, `CampaignStart`, `CampaignForm` |
| **US-33** | Select the Crop Type (Potato / Coffee) | Field Management | `SelectCropTypeCommand`, `CropType`, `FarmingStore`, `CampaignForm`, `CampaignHistory` |
| **US-34** | Seed Variety Specification | Field Management | `SpecifySeedVarietyCommand`, `CropCampaign`, `FarmingStore`, `CampaignForm`, `CampaignHistory` |
| **US-35** | Close and Freeze a Campaign | Field Management | `CloseCropCampaignCommand`, `CampaignStatus`, `FarmingStore`, `CampaignHistory`, `CloseCampaignDialog` |
| **US-36** | Campaign Ledger | Field Management | `CampaignLedger`, `CampaignLedgerAssembler`, `CampaignLedgersApiEndpoint`, `FarmingStore`, `CampaignFinances`, `LedgerSummaryCards`, `ExpenseList` |
| **US-37** | Input and Fertilizer Expenses | Field Management | `RecordInputExpenseCommand`, `ExpenseEntry`, `ExpenseCategory`, `FarmingStore`, `FieldExpense`, `FieldExpenseForm` |
| **US-38** | Labor Expenses | Field Management | `RecordDailyLaborExpenseCommand`, `ExpenseEntry`, `FarmingStore`, `FieldExpense`, `FieldExpenseForm` |
| **US-39** | Freight Expenses | Field Management | `RecordFieldFreightExpenseCommand`, `ExpenseEntry`, `FarmingStore`, `FieldExpense`, `FieldExpenseForm` |
| **US-40** | Yield Estimate and Breakeven Price | Field Management | `SetExpectedYieldCommand`, `RecordActualYieldCommand`, `CampaignLedger`, `FarmingStore`, `BreakevenPanel`, `ActualYieldCard`, `BreakevenReportCard` |
| **US-41** | Campaign Financial Report Export | Field Management | `ExportCampaignCostReportCommand`, `CostReportPdf`, `FileDownloader`, `FarmingStore`, `CostReports`, `CostDistributionCard`, `CostPerHectareCard` |
| **US-44** | Plot NDVI and NDWI Monitoring | Crop Health | `SatelliteObservation`, `RecordSatelliteObservationCommand`, `SatelliteObservationAssembler`, `SatelliteObservationsApiEndpoint`, `CropStore`, `CropHealth`, `CropPlotSelector`, `NdviChartCard` |
| **US-45** | Agroclimatic Alerts by Region | Crop Health | `AgroclimaticAlert`, `ClimateForecast`, `AgroclimaticAlertAssembler`, `ClimateForecastAssembler`, `AgroclimaticAlertsApiEndpoint`, `ClimateForecastsApiEndpoint`, `CropStore`, `AgriculturalAlerts` |
| **US-48** | Pest Report Registration | Crop Health | `RecordPestReportCommand`, `PestReport`, `PestReportAssembler`, `PestReportsApiEndpoint`, `CropStore`, `PestReportForm` |
| **US-49** | Pest Report Inbox | Crop Health | `PestReport`, `CropStore`, `DiagnosisInbox`, `FarmerCase`, `AdvisorPlots` |
| **US-50** | Field Inspections | Crop Health | `ScheduleFieldInspectionCommand`, `FieldInspection`, `FieldInspectionAssembler`, `FieldInspectionsApiEndpoint`, `CropStore`, `FieldInspections` |
| **US-51** | Agronomic Prescriptions | Crop Health | `IssueTechnicalPrescriptionCommand`, `TechnicalPrescription`, `TechnicalPrescriptionAssembler`, `TechnicalPrescriptionsApiEndpoint`, `CropStore`, `PrescriptionForm`, `Prescriptions` |
| **US-52** | Treatment Application Confirmation | Crop Health | `TechnicalPrescription`, `CropStore` (`applyPrescription`), `FarmerCase` |
| **US-53** | Regional Bulletins | Crop Health | `RegionalBulletin`, `CropStore` (`publishBulletin`), `AgriculturalAlerts` |
| **US-54** | Harvest Batch Registration | Harvest Certification | `RegisterHarvestBatchCommand`, `HarvestBatch`, `HarvestBatchAssembler`, `HarvestBatchesApiEndpoint`, `CertificationStore`, `HarvestCertificates` |
| **US-55** | Official Batch Weighing | Harvest Certification | `WeighDeliveredBatchCommand`, `HarvestBatch`, `CertificationStore`, `HarvestCertificates` |
| **US-56** | Representative Sample | Harvest Certification | `ExtractRepresentativeSampleCommand`, `HarvestBatch`, `CertificationStore`, `HarvestCertificates` |
| **US-57** | Potato Caliber Grading | Harvest Certification | `GradePotatoCalibersCommand`, `PotatoGrading`, `CertificationStore`, `HarvestCertificates` |
| **US-58** | Specialty Coffee Cupping | Harvest Certification | `PerformCoffeeCuppingCommand`, `CoffeeCupping`, `CertificationStore`, `HarvestCertificates` |
| **US-59** | Batch Quality Score | Harvest Certification | `HarvestBatch`, `BatchEntry`, `CertificationStore`, `HarvestCertificates` |
| **US-60** | Digital Quality Certificate (PDF) | Harvest Certification | `IssueQualityCertificateCommand`, `RevokeQualityCertificateCommand`, `QualityCertificate`, `QualityCertificateAssembler`, `QualityCertificatesApiEndpoint`, `CertificationStore`, `HarvestCertificates` |
| **US-61** | Traceability QR Code | Harvest Certification | `QualityCertificate`, `CertificationStore` (`downloadCertificate`), `FileDownloader`, `HarvestCertificates` |
| **US-62** | Public Traceability Verification by QR | Harvest Certification | `VerifyCertificateCommand`, `PublicTraceabilityRecord`, `PublicTraceabilityAssembler`, `PublicTraceabilityApiEndpoint`, `CertificationStore`, `PublicTraceability` |
| **TS-05** | Offline Expense Queue and Deferred Sync | Field Management | `OfflineSync`, `PendingOperation`, `PendingExpenseAssembler`, `FarmingStore` (`syncPendingExpenses`), `OfflineSyncBanner` |
| **SH-01** | Switch Application Language | Shared | `LanguageSwitcher`, `TranslateService`, `TranslatedTitleStrategy`, `public/i18n/en/*.json`, `public/i18n/es/*.json` |
| **SH-02** | Navigation and Application Shell by Role | Shared | `App`, `Layout`, `LayoutStore`, `Toolbar`, `LeftSidebar`, `NavigationSection`, `PageHeader`, `PageNotFound`, `roleGuard`, `app.routes.ts` |
| **SH-03** | Graceful Error Handling and User Feedback | Shared | `ErrorHandlingEnabledBaseType`, `BaseApiEndpoint`, `MessageCard`, store error signals (e.g., `IamStore.error`) |

Backlog stories not implemented by the web application: US-01 to US-09 belong to the landing page; US-42, US-43, and US-46 run in the RESTful API (the web application triggers the satellite and forecast imports and shows the resulting alerts); US-15 (two-factor verification) and US-47 (SMS/WhatsApp notifications) are not implemented in this release.

---

## US-10: User Registration (Sign Up)
**Title:** Register New User Account  
**Context:** IAM (Identity and Access Management)  
**Description:**  
_As a new user from the field, I want to sign up with my basic data, credentials, and role so that I can create my account and access the tools of SumaqAgro._

**Acceptance Criteria:**
- **AC10.1 – Registration Validation:** Given a registration attempt, when the first name, last name, email, password, password confirmation, or role do not comply with the validation rules, then the form shows the invalid fields and prevents registration.
- **AC10.2 – Successful Registration:** Given valid registration data, when the user confirms registration, then the system creates the account and lets the user continue to sign in.
- **AC10.3 – Email Already Registered:** Given an email that already has an account, when the user submits the form, then the system informs the user that the account cannot be created with that email.
- **AC10.4 – Agronomist Invitation:** Given an agronomist who opens an invitation link, when the agronomist signs up, then the agronomist role is preselected and the invitation is accepted with the new account.

---

## US-11: Secure Sign In
**Title:** Authenticate and Session Management  
**Context:** IAM (Identity and Access Management)  
**Description:**  
_As a registered user, I want to sign in with my email and password so that I obtain a session and access my information._

**Acceptance Criteria:**
- **AC11.1 – Sign In:** Given valid credentials, when the user signs in, then the system establishes a session and opens the start page of the user's role (producer dashboard, cooperative dashboard, or pest report inbox).
- **AC11.2 – Invalid Credentials:** Given an unknown email or a wrong password, when the user signs in, then the system shows an invalid credentials message without revealing which field was wrong.
- **AC11.3 – Authenticated Requests:** Given an active session, when the application calls the platform API, then every request carries the session token.
- **AC11.4 – Protected Pages:** Given a visitor without a session, when the visitor opens a private page, then the system redirects to the sign-in page and returns to the requested page after signing in.
- **AC11.5 – Expired Session:** Given a session whose token has expired, when the user navigates, then the system closes the session and asks the user to sign in again.

---

## US-12: Plans Catalog during Onboarding
**Title:** View Subscription Plans  
**Context:** Subscriptions and Payments  
**Description:**  
_As a user in the registration process, I want to see the available subscription plans so that I can choose the one that fits my profile._

**Acceptance Criteria:**
- **AC12.1 – Plans by Segment:** Given a signed-in user, when the user opens the plans catalog, then the system shows the plan of the user's segment (Semilla, Cooperativa Pro, or Asesor Técnico) with its prices and limits.
- **AC12.2 – Billing Cycle:** Given the plans catalog, when the user switches between monthly and annual billing, then the prices are updated accordingly.
- **AC12.3 – Access without Subscription:** Given a user without an active subscription, when the user opens a paid feature, then the system redirects to the plans catalog.

---

## US-13: Forgotten Password Recovery
**Title:** Recover Account Access  
**Context:** IAM (Identity and Access Management)  
**Description:**  
_As a registered user, I want to request a password reset by email so that I can recover access to my account if I forget my password._

**Acceptance Criteria:**
- **AC13.1 – Request Link:** Given the forgot password form, when the user submits an email, then the system confirms that a reset link was sent if the account exists, without revealing whether it does.
- **AC13.2 – Reset Password:** Given a valid reset link, when the user enters and confirms a new password, then the system updates the password and lets the user sign in.
- **AC13.3 – Invalid Link:** Given an expired, used, or malformed link, when the user opens it or submits the form, then the system informs the user that the link is no longer valid.

---

## US-14: Secure Sign Out
**Title:** End the Session  
**Context:** IAM (Identity and Access Management)  
**Description:**  
_As an authenticated user, I want to sign out so that my account is protected when I stop using the device._

**Acceptance Criteria:**
- **AC14.1 – Sign Out:** Given an active session, when the user signs out from the toolbar or side menu, then the system removes the session from the device and opens the sign-in page.
- **AC14.2 – No Access After Sign Out:** Given a signed-out user, when the user goes back to a private page, then the system asks for authentication again.

---

## US-16: Profile and Contact Data Update
**Title:** Update My Account  
**Context:** Profiles  
**Description:**  
_As a registered user, I want to edit my name, phone number, preferred language, and photo so that my personal information stays up to date._

**Acceptance Criteria:**
- **AC16.1 – View Profile:** Given a signed-in user, when the user opens the settings page, then the system shows the current profile data.
- **AC16.2 – Update Profile:** Given valid changes, when the user saves the form, then the system stores the changes and confirms the update.
- **AC16.3 – Validation:** Given invalid data (e.g., a malformed DNI or phone number), when the user saves, then the form shows the invalid fields.

---

## US-17: Cooperative Registration
**Title:** Register the Cooperative  
**Context:** Profiles  
**Description:**  
_As a cooperative director, I want to register the institutional data of my cooperative (RUC, business name, region) so that I can formally manage its members._

**Acceptance Criteria:**
- **AC17.1 – Register:** Given a director without a cooperative, when the director submits valid institutional data, then the system registers the cooperative and opens its dashboard.
- **AC17.2 – Duplicated RUC:** Given a RUC that is already registered, when the director submits the form, then the system informs that the RUC belongs to another cooperative.
- **AC17.3 – Update:** Given a registered cooperative, when the director edits its data in the cooperative settings, then the system stores the changes.

---

## US-18: Add Members to the Cooperative Registry
**Title:** Manage the Member Registry  
**Context:** Profiles  
**Description:**  
_As a cooperative director, I want to add producers to the digital registry of my cooperative so that I can manage their production together._

**Acceptance Criteria:**
- **AC18.1 – Look Up Account:** Given the email of a producer with an account, when the director looks it up, then the system fills the member form with the producer's data.
- **AC18.2 – Add Member:** Given valid member data (DNI, names, community, join date), when the director adds the member, then the member appears in the registry.
- **AC18.3 – Member Quota:** Given a cooperative that reached the member limit of its plan, when the director adds a member, then the system explains that the quota was reached.
- **AC18.4 – Link Account:** Given a member without an account link, when the director links the member to a producer email, then the member becomes linked to that account.

---

## US-19: Invite Agronomists
**Title:** Build the Technical Team  
**Context:** Profiles  
**Description:**  
_As a cooperative director, I want to invite agronomists by email so that they join the technical supervision team._

**Acceptance Criteria:**
- **AC19.1 – Send Invitation:** Given a valid email, when the director sends the invitation, then the system registers it as pending and the agronomist receives the invitation email.
- **AC19.2 – Invitation Status:** Given sent invitations, when the director opens the technical team, then each invitation shows whether it is pending or accepted.

---

## US-20: Assign Agronomists to Member Plots
**Title:** Assign a Technical Advisor to a Plot  
**Context:** Profiles  
**Description:**  
_As a cooperative director, I want to assign an agronomist of my technical team to specific member plots so that the agronomist supervises them directly._

**Acceptance Criteria:**
- **AC20.1 – Assign:** Given a member plot and an agronomist of the technical team, when the director assigns the agronomist, then the plot shows the assigned advisor.
- **AC20.2 – Reassign with History:** Given a plot with an advisor, when the director assigns another agronomist, then the plot shows the new advisor and keeps the previous one in its history.
- **AC20.3 – Advisor Quota:** Given an agronomist whose plan reached its supervised plot limit, when the director assigns a new plot, then the system explains that the limit was reached.

---

## US-21: Consolidated Member and Plot Directory
**Title:** Cooperative Dashboard  
**Context:** Profiles  
**Description:**  
_As a cooperative director, I want to see a unified directory of members and registered plots so that I can audit the reach of the organization._

**Acceptance Criteria:**
- **AC21.1 – Dashboard:** Given a registered cooperative, when the director opens the cooperative dashboard, then the system shows the number of members, plots, and assigned advisors.
- **AC21.2 – Member Detail:** Given a member in the directory, when the director opens it, then the system shows the member's plots and their advisors.

---

## US-22: Plot Quota by Plan
**Title:** Control the Plot Quota  
**Context:** Subscriptions and Payments / Field Management  
**Description:**  
_As a subscribed producer, I want the platform to control how many plots my plan allows so that I know how many I can still register and when I need another plan._

**Acceptance Criteria:**
- **AC22.1 – Quota Summary:** Given an active plan, when the producer opens the registered plots, then the system shows used and available plot slots.
- **AC22.2 – Quota Reached:** Given a producer that used all slots, when the producer tries to register another plot, then the system prevents it and suggests changing the plan.

---

## US-23: Paid Plan Selection
**Title:** Select a Plan  
**Context:** Subscriptions and Payments  
**Description:**  
_As a user or director, I want to select the plan of my segment and its billing cycle so that I can extend my plot quota and tools._

**Acceptance Criteria:**
- **AC23.1 – Select Plan:** Given the plans catalog, when the user selects a plan and a billing cycle, then the system opens the checkout with the selected plan and amount.
- **AC23.2 – Plan of Another Segment:** Given a plan that does not match the user's role, when the user tries to select it, then the system does not allow it.

---

## US-24: Secure Card Payment (Mercado Pago)
**Title:** Pay the Subscription  
**Context:** Subscriptions and Payments  
**Description:**  
_As a customer, I want to pay my subscription with a debit or credit card in a secure payment page so that the service is activated._

**Acceptance Criteria:**
- **AC24.1 – Redirect to Payment:** Given a selected plan, when the user confirms the checkout, then the system redirects the browser to the Mercado Pago payment page created by the platform.
- **AC24.2 – No Card Data in the App:** Given the payment flow, when the user pays, then the card data is entered only in the Mercado Pago page, never in SumaqAgro.
- **AC24.3 – Checkout Failure:** Given that the payment page cannot be created, when the user confirms the checkout, then the system shows an error and keeps the user in the checkout.

---

## US-25: Membership Activation
**Title:** Activate the Plan after Payment  
**Context:** Subscriptions and Payments  
**Description:**  
_As a paying customer, I want the system to enable my plan as soon as the payment is approved so that I can start registering plots._

**Acceptance Criteria:**
- **AC25.1 – Approved Payment:** Given an approved payment, when Mercado Pago returns the user to SumaqAgro, then the payment result page confirms the payment and the subscription is active.
- **AC25.2 – Pending or Rejected Payment:** Given a pending or rejected payment, when the user returns, then the payment result page shows the status and lets the user try again.

---

## US-26: Cancel an Active Subscription
**Title:** Cancel the Renewal  
**Context:** Subscriptions and Payments  
**Description:**  
_As a customer of a paid plan, I want to cancel the renewal of my subscription so that I am not charged again._

**Acceptance Criteria:**
- **AC26.1 – Cancel:** Given an active subscription, when the user confirms the cancellation in the billing page, then the subscription shows that it will not renew and remains usable until its end date.

---

## US-27: Billing History and Receipts
**Title:** View Payments and Download Receipts  
**Context:** Subscriptions and Payments  
**Description:**  
_As a paying customer, I want to see my payments and download their receipts so that I can keep the accounting of my organization._

**Acceptance Criteria:**
- **AC27.1 – Payment History:** Given previous payments, when the user opens the billing page, then the system lists each payment with its date, plan, amount, and status.
- **AC27.2 – Download Receipt:** Given a payment, when the user downloads its receipt, then the system saves a PDF receipt on the device.

---

## US-28: Plot Registration
**Title:** Register a Plot  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want to register a new plot with its name, region, and area so that I start the digital record of my land._

**Acceptance Criteria:**
- **AC28.1 – Register:** Given valid plot data and an available slot, when the producer submits the registration, then the system saves the plot and offers to delineate its boundary.
- **AC28.2 – Validation:** Given missing or invalid data (e.g., a repeated plot name), when the producer submits, then the system shows the invalid fields.

---

## US-29: Polygon Delineation with GPS Coordinates
**Title:** Delineate the Plot Boundary  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want to enter or draw the boundary points of my land so that the system calculates its exact area in hectares._

**Acceptance Criteria:**
- **AC29.1 – Draw Boundary:** Given a registered plot, when the producer draws the points on the map or uses the device location, then the system shows the polygon and its calculated area.
- **AC29.2 – Save Boundary:** Given a valid polygon (at least three points, no crossing sides), when the producer saves it, then the plot stores its boundary and is linked to satellite monitoring.
- **AC29.3 – Edit Points:** Given points being drawn, when the producer undoes or clears them, then the map updates the polygon.

---

## US-30: Interactive Plot Map
**Title:** View the Plot on a Map  
**Context:** Field Management  
**Description:**  
_As a producer or advisor, I want to see the plot polygon on an interactive map so that I can inspect its location._

**Acceptance Criteria:**
- **AC30.1 – Plot Detail:** Given a plot with a boundary, when the user opens the plot detail, then the map shows the polygon with the plot's cadastre data.
- **AC30.2 – Plot without Boundary:** Given a plot without a boundary, when the user opens its detail, then the system invites the user to delineate it.

---

## US-31: Soil Analysis Baseline
**Title:** Record the Soil Analysis  
**Context:** Field Management  
**Description:**  
_As a producer or agronomist, I want to enter the laboratory soil data (pH, texture, organic matter) so that the initial conditions of the land are recorded._

**Acceptance Criteria:**
- **AC31.1 – Record:** Given valid soil data, when the user saves the form, then the plot shows its soil baseline.
- **AC31.2 – Validation:** Given values out of range (e.g., pH outside 0–14), when the user saves, then the form shows the invalid fields.

---

## US-32: Open a Crop Campaign
**Title:** Start a Campaign  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want to create a crop campaign with its season and sowing date so that I can track the production over time._

**Acceptance Criteria:**
- **AC32.1 – Start:** Given a plot without an open campaign, when the producer submits the season, crop, seed variety, and sowing date, then the system starts the campaign and opens its ledger.
- **AC32.2 – Campaign Already Open:** Given a plot with an open campaign, when the producer tries to start another, then the system does not allow it.

---

## US-33: Select the Crop Type (Potato / Coffee)
**Title:** Choose the Crop  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want to specify whether the campaign is Andean potato or specialty coffee so that monitoring and quality rules adapt to the crop._

**Acceptance Criteria:**
- **AC33.1 – Select Crop:** Given the campaign form, when the producer chooses the crop type, then the seed varieties and yield unit shown correspond to that crop.
- **AC33.2 – Change Crop:** Given an open campaign, when the producer changes the crop type, then the campaign is updated.

---

## US-34: Seed Variety Specification
**Title:** Record the Seed Variety  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want to record the seed variety sown (e.g., Yungay, Canchán, Caturra, Typica) so that the batch genetics are characterized._

**Acceptance Criteria:**
- **AC34.1 – Known Variety:** Given the list of varieties of the crop, when the producer selects one, then the campaign stores it.
- **AC34.2 – Custom Variety:** Given a variety that is not in the list, when the producer types it as a custom variety, then the campaign stores it marked as custom.

---

## US-35: Close and Freeze a Campaign
**Title:** Close the Campaign  
**Context:** Field Management  
**Description:**  
_As a producer or director, I want to close the campaign after harvest so that its costs and metrics are frozen._

**Acceptance Criteria:**
- **AC35.1 – Close:** Given an open campaign, when the user confirms the closure, then the campaign is finished and its ledger no longer accepts expenses.
- **AC35.2 – Campaign History:** Given finished campaigns, when the user opens the campaign history, then each one shows its final status and results.

---

## US-36: Campaign Ledger
**Title:** View the Campaign Ledger  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want a ledger opened automatically for each campaign so that I can follow every operating cost._

**Acceptance Criteria:**
- **AC36.1 – Ledger Summary:** Given an open campaign, when the producer opens the finances page, then the system shows the total investment, the expenses by category, and the breakeven price.
- **AC36.2 – Expense List:** Given recorded expenses, when the producer filters by category, then the list shows only the expenses of that category.

---

## US-37: Input and Fertilizer Expenses
**Title:** Record Input Expenses  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want to record purchases of fertilizers, seeds, and pesticides so that I control my investment in inputs._

**Acceptance Criteria:**
- **AC37.1 – Record:** Given valid input data (name, quantity, unit price, date), when the producer saves the expense, then it appears in the ledger and the totals are recalculated.
- **AC37.2 – Validation:** Given invalid values (e.g., zero quantity), when the producer saves, then the form shows the invalid fields.

---

## US-38: Labor Expenses
**Title:** Record Labor Expenses  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want to record payments to workers for sowing, weeding, or harvesting so that labor is included in my costs._

**Acceptance Criteria:**
- **AC38.1 – Record:** Given the activity, number of workers, days, and daily wage, when the producer saves the expense, then the ledger adds its total.

---

## US-39: Freight Expenses
**Title:** Record Freight Expenses  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want to record transport costs of the harvest so that logistics are included in the production cost._

**Acceptance Criteria:**
- **AC39.1 – Record:** Given the route and cost, when the producer saves the expense, then the ledger adds it to the freight category.

---

## US-40: Yield Estimate and Breakeven Price
**Title:** Know the Minimum Selling Price  
**Context:** Field Management  
**Description:**  
_As an agricultural producer, I want to know the minimum selling price per sack or quintal that covers my costs so that I can negotiate with a profit margin._

**Acceptance Criteria:**
- **AC40.1 – Expected Yield:** Given an open campaign, when the producer enters the expected yield, then the system shows the breakeven price per unit.
- **AC40.2 – Actual Yield:** Given a harvested campaign, when the producer records the actual yield, then the breakeven price is recalculated with the real harvest.

---

## US-41: Campaign Financial Report Export
**Title:** Export the Cost Report  
**Context:** Field Management  
**Description:**  
_As a producer or director, I want to export the financial summary of a campaign so that I can present it at assemblies or banks._

**Acceptance Criteria:**
- **AC41.1 – Report Page:** Given a campaign with expenses, when the user opens the reports page, then the system shows the cost distribution and the cost per hectare.
- **AC41.2 – Export PDF:** Given the report, when the user exports it, then the system downloads a PDF with the campaign costs.

---

## US-44: Plot NDVI and NDWI Monitoring
**Title:** Monitor Crop Health by Satellite  
**Context:** Crop Health  
**Description:**  
_As a producer or agronomist, I want to select a plot and see its boundary and NDVI and NDWI indexes so that I can review its condition._

**Acceptance Criteria:**
- **AC44.1 – Observations:** Given a plot linked to satellite monitoring, when the user selects it, then the system shows its latest observations and the NDVI trend.
- **AC44.2 – Import Latest Image:** Given a plot with a boundary, when the user requests the latest image, then the system imports it and updates the indexes.
- **AC44.3 – Plot Not Ready:** Given a plot without a boundary, when the user selects it, then the system explains that the boundary must be delineated first.

---

## US-45: Agroclimatic Alerts by Region
**Title:** Check Agroclimatic Alerts  
**Context:** Crop Health  
**Description:**  
_As an agricultural producer, I want to see the agroclimatic alerts and forecasts of my plot's region so that I know the risks and recommendations._

**Acceptance Criteria:**
- **AC45.1 – Alerts and Forecast:** Given a plot in a region, when the producer opens the alerts page, then the system lists the alerts by severity and the weather forecast.
- **AC45.2 – Refresh Forecast:** Given a plot, when the producer refreshes the forecast, then the system imports it and shows any new alerts.

---

## US-48: Pest Report Registration
**Title:** Report a Pest or Disease  
**Context:** Crop Health  
**Description:**  
_As an agricultural producer, I want to report a pest indicating the plot, the symptoms, and their severity so that I can request a technical review._

**Acceptance Criteria:**
- **AC48.1 – Record:** Given a plot, a description, and a severity, when the producer submits the report, then the report is registered as open.
- **AC48.2 – Validation:** Given an empty description or no plot, when the producer submits, then the form shows the invalid fields.

---

## US-49: Pest Report Inbox
**Title:** Follow Up Pest Reports  
**Context:** Crop Health  
**Description:**  
_As a producer or agronomist, I want to see the pest reports of my plots with their description, severity, and status so that I can follow up on them._

**Acceptance Criteria:**
- **AC49.1 – Inbox:** Given reports on the user's plots, when the user opens the inbox, then each report shows its plot, severity, and status.
- **AC49.2 – Report Detail:** Given a report, when the user opens it, then the system shows its inspections and prescriptions.
- **AC49.3 – Delete:** Given an open report without follow-up, when the producer deletes it, then it is removed from the inbox.

---

## US-50: Field Inspections
**Title:** Schedule and Record Inspections  
**Context:** Crop Health  
**Description:**  
_As an agronomist, I want to schedule an inspection for a report and record the result of the visit so that the evaluation is tracked._

**Acceptance Criteria:**
- **AC50.1 – Schedule:** Given a report on an assigned plot, when the agronomist schedules an inspection date, then the inspection appears as scheduled.
- **AC50.2 – Complete:** Given a scheduled inspection, when the agronomist records the findings, then the inspection is completed.

---

## US-51: Agronomic Prescriptions
**Title:** Issue a Prescription  
**Context:** Crop Health  
**Description:**  
_As an agronomist, I want to record a prescription with product, dose, instructions, and application date for an inspected report so that the producer knows what to apply._

**Acceptance Criteria:**
- **AC51.1 – Issue:** Given an inspected report, when the agronomist submits a valid prescription, then the prescription is issued and visible to the producer.
- **AC51.2 – Prescription List:** Given issued prescriptions, when the agronomist opens the prescriptions page, then each one shows its plot, product, and status.

---

## US-52: Treatment Application Confirmation
**Title:** Confirm the Treatment  
**Context:** Crop Health  
**Description:**  
_As an agricultural producer, I want to mark a prescription as applied so that my advisor knows I followed the treatment._

**Acceptance Criteria:**
- **AC52.1 – Apply:** Given an issued prescription, when the producer confirms its application, then the prescription is marked as applied with its date.

---

## US-53: Regional Bulletins
**Title:** Publish a Regional Bulletin  
**Context:** Crop Health  
**Description:**  
_As an agronomist, I want to publish an alert bulletin for every producer of a region so that I can prevent the spread of a pest outbreak._

**Acceptance Criteria:**
- **AC53.1 – Publish:** Given a region, a title, and content, when the agronomist publishes the bulletin, then it appears in the alerts page of that region.
- **AC53.2 – Read:** Given published bulletins, when a producer opens the alerts page, then the bulletins of the producer's region are listed.

---

## US-54: Harvest Batch Registration
**Title:** Register a Harvest Batch  
**Context:** Harvest Certification  
**Description:**  
_As a cooperative director, I want to register a harvest batch received from a member so that its quality evaluation can start._

**Acceptance Criteria:**
- **AC54.1 – Register:** Given a member, one of the member's plots, the crop, and the harvest date, when the director registers the batch, then it appears in the batch list.
- **AC54.2 – Plot of Another Member:** Given a plot that does not belong to the member, when the director registers the batch, then the system rejects it.

---

## US-55: Official Batch Weighing
**Title:** Weigh the Batch  
**Context:** Harvest Certification  
**Description:**  
_As a collection manager, I want to record the gross weight and tare of the batch so that its official net weight is set._

**Acceptance Criteria:**
- **AC55.1 – Weigh:** Given a registered batch, when the user records gross weight and tare, then the batch shows its net weight in kilograms.

---

## US-56: Representative Sample
**Title:** Record the Sample  
**Context:** Harvest Certification  
**Description:**  
_As a technical grader, I want to record the representative sample taken from the batch so that it can be analyzed._

**Acceptance Criteria:**
- **AC56.1 – Sample:** Given a weighed batch, when the user records the sample identifier and weight, then the batch is ready for grading.

---

## US-57: Potato Caliber Grading
**Title:** Grade Potato Calibers  
**Context:** Harvest Certification  
**Description:**  
_As a technical grader, I want to enter the potato caliber distribution (first, second, third) and pest damage so that the commercial quality of the batch is evaluated._

**Acceptance Criteria:**
- **AC57.1 – Grade:** Given a sampled potato batch, when the user enters valid percentages, then the batch is graded with its quality score and category.
- **AC57.2 – Validation:** Given percentages that are out of range, when the user saves, then the form shows the invalid fields.

---

## US-58: Specialty Coffee Cupping
**Title:** Record the Coffee Cupping  
**Context:** Harvest Certification  
**Description:**  
_As a certified cupper, I want to enter the cupping scores (aroma, flavor, acidity, body) so that the total SCA score is determined._

**Acceptance Criteria:**
- **AC58.1 – Cupping:** Given a sampled coffee batch, when the user enters the scores and whether there is a fermentation defect, then the batch is graded with its category.

---

## US-59: Batch Quality Score
**Title:** View the Quality Score  
**Context:** Harvest Certification  
**Description:**  
_As a cooperative director, I want the system to assign a quality score to each graded batch so that the product is categorized before sale._

**Acceptance Criteria:**
- **AC59.1 – Score:** Given a graded batch, when the director opens the batch list, then the batch shows its quality score and category.

---

## US-60: Digital Quality Certificate (PDF)
**Title:** Issue a Quality Certificate  
**Context:** Harvest Certification  
**Description:**  
_As a cooperative director, I want to issue a digital quality certificate with a SHA-256 hash so that the value of the batch is backed before buyers and auditors._

**Acceptance Criteria:**
- **AC60.1 – Issue:** Given a graded batch without a certificate, when the director issues the certificate, then the batch shows its certificate number.
- **AC60.2 – Revoke:** Given an active certificate, when the director revokes it, then the certificate is marked as revoked.
- **AC60.3 – Find:** Given a certificate number, when the director searches it, then the system shows the certificate.

---

## US-61: Traceability QR Code
**Title:** Download the Certificate with its QR Code  
**Context:** Harvest Certification  
**Description:**  
_As a director or warehouse manager, I want to download the certificate with its QR code so that I can print it and attach it to the sacks or documents of the batch._

**Acceptance Criteria:**
- **AC61.1 – Download:** Given an active certificate, when the user downloads it, then the system saves the PDF with the QR code that leads to the public verification.

---

## US-62: Public Traceability Verification by QR
**Title:** Verify a Certificate  
**Context:** Harvest Certification  
**Description:**  
_As a public visitor, I want to scan the QR code of a certificate so that I can verify the authenticity, variety, and origin of the product without an account._

**Acceptance Criteria:**
- **AC62.1 – Authentic Certificate:** Given a valid QR code, when the visitor opens it, then the public page shows the batch, crop, variety, quality, plot, and region, and marks the certificate as authentic.
- **AC62.2 – Invalid or Revoked:** Given an unknown, altered, or revoked certificate, when the visitor opens it, then the page warns that the certificate is not authentic.
- **AC62.3 – Manual Verification:** Given a certificate number, when the visitor enters it without scanning, then the page verifies it in the same way.

---

## TS-05: Offline Expense Queue and Deferred Sync
**Title:** Record Expenses without Connection  
**Context:** Field Management  
**Description:**  
_As an agricultural producer in a rural area, I want to record expenses without internet so that no cost is lost when the signal drops._

**Acceptance Criteria:**
- **ACT5.1 – Offline Recording:** Given no connection, when the producer saves an expense, then the expense is queued on the device and the application shows it as pending.
- **ACT5.2 – Deferred Sync:** Given queued expenses, when the connection returns or the producer synchronizes, then the expenses are sent and removed from the queue.
- **ACT5.3 – No Duplicates:** Given an expense sent twice, when the platform receives it, then it is recorded only once.

Note: the report specifies IndexedDB/Dexie.js; the implementation uses `localStorage` through `OfflineSync`.

---

## SH-01: Internationalization and Language Switching
**Title:** Switch Application Language  
**Context:** Shared  
**Description:**  
_As a user, I want to switch between English and Spanish at any moment so that the interface is displayed in my preferred language._

**Acceptance Criteria:**
- **ACS1.1 – Language Selection:** Given a user selecting a supported language, when the selection is confirmed, then the system updates the active language without reloading the page.
- **ACS1.2 – Content Localization:** Given a language change, when the system presents textual content, then labels, messages, browser tab titles, dates, and numbers are displayed in the chosen language.

---

## SH-02: Navigation and Application Shell by Role
**Title:** Navigate the Application  
**Context:** Shared  
**Description:**  
_As a user, I want a menu with the sections of my role so that I can move through the application easily._

**Acceptance Criteria:**
- **ACS2.1 – Menu by Role:** Given a signed-in user, when the application shell opens, then the side menu shows only the sections of the user's role.
- **ACS2.2 – Pages of Another Role:** Given a user that opens a page of another role, when the navigation happens, then the system returns the user to the start page of the user's role.
- **ACS2.3 – Unrecognized Page:** Given a non-existent path, when the user opens it, then the system shows a page-not-found view with a way back to the start page.
- **ACS2.4 – Responsive Shell:** Given a small screen, when the user navigates, then the side menu collapses and opens on demand.

---

## SH-03: Error Handling and Validation Feedback
**Title:** Graceful Error Handling and User Feedback  
**Context:** Shared  
**Description:**  
_As a user, I want clear feedback when operations fail or inputs are invalid so that I understand what happened and how to proceed._

**Acceptance Criteria:**
- **ACS3.1 – Operation Failure Feedback:** Given a failed operation or a connection error, when the error occurs, then the system shows a user-friendly message without exposing internal details.
- **ACS3.2 – Input Validation Feedback:** Given invalid or missing input, when the form is submitted, then the system highlights the invalid fields with specific messages.
