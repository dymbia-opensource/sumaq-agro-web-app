# SumaqAgro – Web Application

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular)](https://angular.dev/)
[![Angular Material](https://img.shields.io/badge/Angular%20Material-22-3F51B5?logo=angular)](https://material.angular.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SumaqAgro** web application (by the **Dymbia** startup) for Andean potato and specialty coffee producers, cooperatives, and agronomists. It is a *Single Page Application* built with **Angular 22** and **Angular Material**, organized by *bounded context* following **Domain-Driven Design**.

| | URL |
|---|---|
| Deployed application | https://sumaqagro-appweb.web.app |
| Deployed fake API | https://sumaqagro-fake-api.onrender.com/api/v1 |

## Requirements

| Tool | Version | Check with |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20.19+, 22.12+, or 24+ | `node --version` |
| npm | 10+ | `npm --version` |
| Git | 2.x | `git --version` |

Libraries do not need to be installed individually: they are listed in `package.json` and installed with `npm install`.

## Running locally

```bash
git clone https://github.com/dymbia-opensource/sumaqAgro-appweb.git
cd sumaqAgro-appweb
npm install
```

Until the RESTful API is ready, data comes from a **fake API** using json-server (`server/db.json`). Open **two terminals**:

```bash
# Terminal 1: fake API at http://localhost:3000/api/v1
npm run api
```

```bash
# Terminal 2: application at http://localhost:4200
npm start
```

Open `http://localhost:4200` to sign in or register an account. During development,
IAM simulates authentication and restores the session within each tab for 30 minutes;
mock accounts remain in memory, and password recovery is a preview.
Integration with the real backend is still pending.

The layer and test organization is documented in [Frontend architecture](docs/frontend-architecture.md).

### Test accounts with existing data

With `npm run api` and `npm start` running, open **Try sample data** on the
sign-in page. Selecting an account fills in the form; then click **Sign in**.

| Role | Email | Linked ID in the fake API |
|---|---|---|
| Farmer | `farmer@sumaqagro.test` | 1: Guillermo's profile and plots |
| Cooperative director | `cooperative@sumaqagro.test` | 3: Cooperativa Agraria Valle del Mantaro |
| Agronomist | `agronomist@sumaqagro.test` | 4: existing advisor and assignments |

Shared demo password: `SumaqAgroDemo2026!`.

These accounts are reinitialized after reloading and only work with
mock authentication during development. New accounts retain their own
identifiers and start without associated data; they do not inherit anyone
else's information. `server/db.json` is not modified, and passwords are not stored in the browser.

| Command | Description |
|---|---|
| `npm start` | Runs the application in development mode (`ng serve`) |
| `npm run api` | Runs the fake API on port 3000 |
| `npm run build` | Builds for production in `dist/sumaqAgro-appweb/browser` |
| `npm test` | Runs unit tests with Vitest |
| `npm run check:architecture` | Checks layer boundaries, imports, and file organization |

## Deployment

The application is deployed on **Firebase Hosting**, and the fake API is deployed on **Render**. The API URL used by the deployed version is configured in `src/environments/environment.ts`.

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

### Fake API (Render)

Render automatically redeploys the fake API after every push to `develop`. To create it in another account, select **New → Web Service**, use this repository, and configure:

| Field | Value |
|---|---|
| Branch | `develop` |
| Runtime | Node |
| Build Command | `npm install --include=dev` |
| Start Command | `npx json-server server/db.json --routes server/routes.json --host 0.0.0.0 --port $PORT` |
| Instance Type | Free |

Then update `platformProviderApiBaseUrl` in `src/environments/environment.ts` with the new URL. On the free plan, the service spins down after 15 minutes of inactivity (the first request takes a few seconds), and changes made through the application are lost when it restarts.

## Structure

Each folder in `src/app` is a *bounded context* (a component in the C4 diagram in section 4.6 of the report) with four layers: `domain`, `application`, `infrastructure`, and `presentation`. File names match those in the class diagrams in section 4.7.

```
sumaqAgro-appweb/
├── docs/
│   ├── diagram-web-aplication/            # Web Application class diagrams (PlantUML)
│   └── diagram-restful-api/               # RESTful API class diagrams (PlantUML)
├── public/                                # Copied unchanged into the build
│   ├── i18n/
│   │   ├── es/                            # shared.json + one file per bounded context
│   │   └── en/                            # The same files in English
│   └── images/
├── server/
│   ├── db.json                            # Fake API data (json-server)
│   └── routes.json                        # Rewrites /api/v1/* → /*
├── src/
│   ├── app/
│   │   ├── shared/                        # Resources used by all contexts
│   │   │   ├── domain/model/              # BaseEntity
│   │   │   ├── infrastructure/            # BaseApi, BaseApiEndpoint, BaseAssembler, API dates, file downloads
│   │   │   └── presentation/
│   │   │       ├── components/            # layout (+ layout.store), left-sidebar, toolbar, language-switcher, page-header, message-card
│   │   │       └── views/                 # page-not-found
│   │   │
│   │   ├── field-management/              # Plots, GPS polygons, campaigns, and costs
│   │   │   ├── domain/model/
│   │   │   │   ├── entities/              # Entities (*.entity.ts) and enums
│   │   │   │   └── commands/              # Commands (*.command.ts)
│   │   │   ├── application/               # Store with signals (*.store.ts)
│   │   │   ├── infrastructure/            # Facade (*-api.ts)
│   │   │   │   ├── endpoints/             # HTTP calls for each resource (*.endpoint.ts)
│   │   │   │   ├── assemblers/            # Resource ↔ entity (*.assembler.ts)
│   │   │   │   ├── responses/             # API contracts (*.response.ts)
│   │   │   │   └── offline/               # Expenses saved offline (TS-05)
│   │   │   ├── presentation/views/        # One folder per view (.ts, .html, .css)
│   │   │   └── field-management.routes.ts # Context routes (lazy loading)
│   │   │
│   │   ├── crop-health/                   # NDVI/NDWI, alerts, pests, and prescriptions
│   │   ├── profiles/                      # Profiles, cooperatives, and members
│   │   ├── harvest-certification/         # Batches, grading, certificates, and QR verification
│   │   │                                  # (all three use the same layers as field-management)
│   │   ├── app.config.ts                  # Providers: router, HttpClient, translations (ngx-translate)
│   │   ├── app.routes.ts                  # Root routes: private pages within the layout
│   │   └── app.ts
│   ├── environments/
│   │   ├── environment.development.ts     # Local API (json-server)
│   │   └── environment.ts                 # Deployed API (Render)
│   ├── material-theme.scss                # Angular Material theme
│   └── styles.css
├── angular.json
├── firebase.json                          # Firebase Hosting: build folder and SPA routes
├── .firebaserc                            # Firebase project
└── package.json
```

A new *bounded context* creates its folder with the same layers, adds its `*.routes.ts` to `app.routes.ts`, and adds its translation file to `public/i18n/{es,en}/` and to `TRANSLATION_FILES` in `app.config.ts`.

## How we work

* **GitFlow:** `main` (production), `develop` (integration), and one `feature/<name>` branch per feature. Features are merged into `develop` using `git merge --no-ff`.
* **Conventional Commits:** `feat(<context>): ...`, `fix(...)`, `refactor(...)`, `chore: ...`, `docs: ...`.
* **Conflicts:** in `server/db.json` and `src/app/app.routes.ts`, preserve the lines from both branches. Each context edits only its own translation file.

## Crop Health: demo workflow

- Farmer: views their plots and observations, submits reports, and views their visits and prescriptions.
- Director: views plots belonging to active members of their cooperative and schedules visits.
- Agronomist (Juan A. Morales, user 4): views their cooperative's plots, completes visits, issues prescriptions, and marks reports as resolved. Their identity comes from the session, not from a manual selector.

Plot selection is shared with Field Management. The viewer draws the registered polygon over a map or a hybrid satellite background and displays the stored indices; it does not download multispectral images. The available download is a PNG summary sheet with the logo and recorded values.

A visit is scheduled for a future date and can be completed from that date onward, with at least 10 characters describing the findings. Upon completion, the report changes from PENDING to INSPECTED, allowing a prescription to be issued. After recording a prescription, the agronomist can mark the report as RESOLVED. If the report update fails after saving a visit, the screen allows that status to be synchronized without creating another visit.

Role and plot access controls belong to the demo frontend. json-server does not authenticate users or protect its endpoints; real authorization must be implemented in the backend. State is cleared and previous queries are canceled when the user changes.
