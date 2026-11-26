# SumaqAgro – Web Application

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular)](https://angular.dev/)
[![Angular Material](https://img.shields.io/badge/Angular%20Material-22-3F51B5?logo=angular)](https://material.angular.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SumaqAgro** web application (by the **Dymbia** startup) for Andean potato and specialty coffee producers, cooperatives, and agronomists. It is a *Single Page Application* built with **Angular 22** and **Angular Material**, organized by *bounded context* following **Domain-Driven Design**.

| | URL |
|---|---|
| Deployed application | https://sumaqagro-appweb.web.app |
| RESTful API (SumaqAgro Platform) | https://sumaq-agro-platform.onrender.com/api/v1 |

## Requirements

| Tool | Version | Check with |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20.19+, 22.12+, or 24+ | `node --version` |
| npm | 10+ | `npm --version` |
| Git | 2.x | `git --version` |

Libraries do not need to be installed individually: they are listed in `package.json` and installed with `npm install`.

## Running locally

```bash
git clone https://github.com/dymbia-opensource/sumaq-agro-web-app.git
cd sumaq-agro-web-app
npm install
```

The data comes from the **SumaqAgro Platform** RESTful API ([sumaq-agro-platform](https://github.com/dymbia-opensource/sumaq-agro-platform), v1.1.0). Start it first on `http://localhost:8080` (see its README: MySQL, `JWT_SECRET`, and the other environment variables), then start the application:

```bash
# Application at http://localhost:4200
npm start
```

`src/environments/environment.development.ts` points to `http://localhost:8080/api/v1`. The platform allows requests from `http://localhost:4200` (`FRONTEND_ORIGIN`).

Open `http://localhost:4200`, register an account in `/iam/sign-up`, and sign in. A new account has no plan yet, so it opens the plan catalog first:

* With Mercado Pago test credentials in the platform (`MERCADOPAGO_ACCESS_TOKEN`), pay with a Mercado Pago test buyer account. Mercado Pago sends you back to `/subscriptions/payment-result`, which confirms the payment.
* In the `dev` profile of the platform, the checkout also offers a **simulated payment**, which activates the plan without Mercado Pago.

The emails of the platform link to the application: password recovery opens `/iam/reset-password?token=...`, and an agronomist invitation opens `/iam/sign-up?invitationToken=...`.

The layer and test organization is documented in [Frontend architecture](docs/frontend-architecture.md).

| Command | Description |
|---|---|
| `npm start` | Runs the application in development mode (`ng serve`) |
| `npm run build` | Builds for production in `dist/sumaqAgro-appweb/browser` |
| `npm test` | Runs unit tests with Vitest |
| `npm run check:architecture` | Checks layer boundaries, imports, and file organization |

## Deployment

The application is deployed on **Firebase Hosting** and uses the SumaqAgro Platform deployed on **Render**. The API URL used by the deployed version is configured in `src/environments/environment.ts`; the platform must allow the deployed origin in `FRONTEND_ORIGIN`.

### Web application (Firebase Hosting)

Access to the `sumaqagro-appweb` Firebase project is required (granted by the project owner under *Settings → Users and permissions*). When setting up a computer for the first time:

```bash
npm install -g firebase-tools
firebase login
```

To deploy a new version from the updated `develop` branch:

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` publishes `dist/sumaqAgro-appweb/browser` and redirects every route to `index.html`, allowing Angular to open the correct view when the page is reloaded. `.firebaserc` specifies the project (`sumaqagro-appweb`).

## Structure

Each folder in `src/app` is a *bounded context* with four layers: `domain`, `application`, `infrastructure`, and `presentation`.

```
sumaq-agro-web-app/
├── docs/                                  # Architectural and requirement documentation
│   ├── adrs.md                            # Architectural Decision Records (ADRs)
│   ├── class-diagrams/                    # PlantUML class diagram of each bounded context
│   ├── frontend-architecture.md           # Layer and test organization
│   └── user-stories.md                    # Functional user stories & Requirements Traceability Matrix (RTM)
├── public/                                # Copied unchanged into the build
│   ├── i18n/
│   │   ├── es/                            # shared.json + one file per bounded context
│   │   └── en/                            # The same files in English
│   └── images/
├── src/
│   ├── app/
│   │   ├── shared/                        # Resources used by all contexts
│   │   │   ├── domain/model/              # BaseEntity, Money
│   │   │   ├── infrastructure/            # BaseApi, BaseApiEndpoint, BaseAssembler, API dates, file downloads
│   │   │   └── presentation/
│   │   │       ├── components/            # layout (+ layout.store), left-sidebar, toolbar, language-switcher, page-header, message-card
│   │   │       └── views/                 # page-not-found
│   │   │
│   │   ├── iam/                           # Sign-in, sign-up, password recovery, guard, and interceptor
│   │   ├── farming/                       # Plots, GPS polygons, campaigns, and cost ledgers
│   │   │   ├── domain/model/
│   │   │   │   ├── entities/              # Entities (*.entity.ts) and enums
│   │   │   │   └── commands/              # Commands (*.command.ts)
│   │   │   ├── application/               # Store with signals (*.store.ts)
│   │   │   ├── infrastructure/            # Facade (*-api.ts)
│   │   │   │   ├── endpoints/             # HTTP calls for each resource
│   │   │   │   ├── assemblers/            # Resource ↔ entity, command → request
│   │   │   │   ├── requests/              # Bodies sent to the API (*.request.ts)
│   │   │   │   ├── responses/             # API contracts (*.response.ts)
│   │   │   │   └── offline/               # Expenses saved offline
│   │   │   ├── presentation/views/        # One folder per view (.ts, .html, .css)
│   │   │   └── farming.routes.ts          # Context routes (lazy loading)
│   │   │
│   │   ├── crop/                          # NDVI/NDWI, climate, alerts, pests, and prescriptions
│   │   ├── profiles/                      # Profiles, cooperatives, members, and agronomists
│   │   ├── certification/                 # Batches, grading, certificates, and QR verification
│   │   ├── subscriptions/                 # Plans, Mercado Pago checkout, and billing history
│   │   │                                  # (all of them use the same layers as farming)
│   │   ├── app.config.ts                  # Providers: router, HttpClient, translations (ngx-translate)
│   │   ├── app.routes.ts                  # Root routes: private pages within the layout
│   │   └── app.ts
│   ├── environments/
│   │   ├── environment.development.ts     # Local API (http://localhost:8080/api/v1)
│   │   └── environment.ts                 # Deployed API (Render)
│   ├── material-theme.scss                # Angular Material theme
│   └── styles.css
├── angular.json
├── firebase.json                          # Firebase Hosting: build folder and SPA routes
├── .firebaserc                            # Firebase project
└── package.json
```

A new *bounded context* creates its folder with the same layers, adds its `*.routes.ts` to `app.routes.ts`, and adds its translation file to `public/i18n/{es,en}/` and to `TRANSLATION_FILES` in `app.config.ts`.

## Documentation

- **User Stories & Requirements Traceability**: [`docs/user-stories.md`](docs/user-stories.md) - Functional requirement specifications and RTM mapping.
- **Class Diagrams**: [`docs/class-diagrams/`](docs/class-diagrams/) - PlantUML model of each bounded context: entities, commands, assemblers, endpoints, stores, and components.
- **Architectural Decision Records (ADRs)**: [`docs/adrs.md`](docs/adrs.md) - Key architectural and technology choices.
- **Frontend Architecture**: [`docs/frontend-architecture.md`](docs/frontend-architecture.md) - Layer and test organization.
- **Contributing Guidelines**: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Changelog**: [`CHANGELOG.md`](CHANGELOG.md)

## How we work

* **GitFlow:** `main` (production), `develop` (integration), and one `feature/<name>` branch per feature. Features are merged into `develop` using `git merge --no-ff`.
* **Conventional Commits:** `feat(<context>): ...`, `fix(...)`, `refactor(...)`, `chore: ...`, `docs: ...`.
* **Conflicts:** in `src/app/app.routes.ts`, preserve the lines from both branches. Each context edits only its own translation file.

## Security

The guards and role checks of the application only decide which pages to show. Every request carries the JWT of the session (`Authorization: Bearer`), and the platform authenticates and authorizes it. The token lasts 30 minutes; after that the user signs in again.
