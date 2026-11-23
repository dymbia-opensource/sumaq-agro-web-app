# Contributing to SumaqAgro Web Application

Thank you for contributing to the SumaqAgro Web Application, built by the **Dymbia** team. This document sets the architecture rules, coding standards and development workflow that keep the codebase consistent while several team members work on different bounded contexts.

---

## Table of Contents
1. [Architecture & Design Principles](#architecture--design-principles)
   - [Domain-Driven Design (DDD)](#domain-driven-design-ddd)
   - [Object-Oriented Programming (OOP) & Clean Code](#object-oriented-programming-oop--clean-code)
2. [Git Workflow & Branching Strategy](#git-workflow--branching-strategy)
3. [Conventional Commits](#conventional-commits)
4. [Semantic Versioning (SemVer)](#semantic-versioning-semver)
5. [TypeScript Guidelines](#typescript-guidelines)
6. [Angular & Angular Material Standards](#angular--angular-material-standards)
7. [RESTful API & Environments](#restful-api--environments)
8. [Quality Assurance & Development Workflow](#quality-assurance--development-workflow)
9. [Pull Request (PR) Process](#pull-request-pr-process)

---

## Architecture & Design Principles

### Domain-Driven Design (DDD)
The code is organized by **bounded context** under `src/app/`. Each context has an owner in the team:

| Folder | Bounded context | Responsibility |
|---|---|---|
| `shared` | Shared Kernel | Base classes, layout shell, i18n, demo session and reusable components. |
| `farming` | Farming (Field Management) | Plots with their GPS polygon, crop campaigns and the cost ledger (breakeven price). |
| `crop` | Crop (Crop Health) | Satellite monitoring (NDVI/NDWI), agroclimatic alerts, pest reports, inspections and prescriptions. |
| `profiles` | Profiles | Farmer profile, cooperatives, members and the technical team of agronomists. |
| `certification` | Certification (Harvest Certification) | Harvest batches, quality grading and certificates with public QR traceability. |
| `iam`, `subscriptions` | IAM, Subscriptions and Payments | Designed in the class diagrams; not implemented yet. Until IAM exists, `shared/application/demo-session.service.ts` provides the signed-in user. |

Each bounded context follows the same four layers:
```text
src/app/<bounded-context>/
├── domain/
│   └── model/
│       ├── entities/       # Entities (*.entity.ts), enums and value objects (*.ts without suffix).
│       └── commands/       # Commands (*.command.ts) with the intention of the user.
│                           # The domain must NOT depend on Angular, HTTP or other layers.
├── application/            # ONE store per bounded context (<context>.store.ts) with signals.
├── infrastructure/         # API facade (<context>-api.ts), endpoints/, assemblers/ and responses/.
├── presentation/
│   ├── views/              # Routed pages: read the store, create commands and navigate.
│   └── components/         # Small presentational pieces: input() / output(), no store, no router.
└── <context>.routes.ts     # Lazy-loaded routes of the context.
```

Dependency rules between layers:

| Code in… | May import |
|---|---|
| `presentation/views` | Angular and Material, its `application` store, `domain` commands and entities, `presentation/components`, `shared/presentation` |
| `presentation/components` | Angular and Material, `domain` entities |
| `application` | `domain`, `infrastructure` |
| `infrastructure` | `domain`, `shared/infrastructure` |
| `domain` | Only `shared/domain` |

Bounded contexts do not call each other's views or stores directly. When a context needs data from another one (for example, Field Management shows the NDVI of Crop Health), its **store** reads the other context's **API facade**.

### Object-Oriented Programming (OOP) & Clean Code
- **SOLID Principles**: One responsibility per class (an assembler only maps data, a view only arranges components), depend on abstractions (`BaseApi`, `BaseAssembler`) and keep components open for extension through `input()` and `output()`.
- **Rich Domain Model**: Business rules live in the entities, not in the views. For example, `FieldPlot.calculateAreaHectares()`, `FieldPlot.isSimplePolygon()` and `CampaignLedger.breakevenPrice()`.
- **Encapsulation**: Entities keep their state in `private _field` properties and expose getters and behavior methods. State only changes through domain methods (`delineateBoundary`, `recordInputExpense`, `setExpectedYield`).
- **Value Objects and Enums**: Values without identity (`Money`, `GeoCoordinate`) validate themselves. States and types are enums (`PlotStatus`, `ExpenseCategory`), never loose strings.
- **Assembler Pattern**: Keep API resources (`*Resource`, `*Response`) separated from domain entities through `BaseAssembler` implementations.
- **Composition over Inheritance**: The API facade (`<Context>Api extends BaseApi`) composes one endpoint per resource (`*ApiEndpoint extends BaseApiEndpoint`).

---

## Git Workflow & Branching Strategy

We follow the **Git Flow** branching model (the WebStorm Git Flow plugin is used to start and finish branches):

```text
main ──────────────────────────────────────────●────── (Releases, tagged vX.Y.Z)
         \                                    /
develop ──●─────────●───────────────●────────●──────── (Integration branch)
           \       /                 \      /
feature/    ●─────●                   ●────●           (Feature branches)
```

### Branch Types & Naming Conventions
- `main`: Released code, deployed to Firebase Hosting. Only receives `release/*` and `hotfix/*` branches and is tagged with SemVer (`v1.0.0`).
- `develop`: Integration branch where finished features are merged.
- `feature/<context>-<short-description>`: New features, refactors, fixes and documentation (from `develop`, back to `develop`).
  - *Examples:* `feature/farming-components`, `feature/crop-presentation`, `feature/docs-changelog-contributing`
  - Always use the `feature/` prefix: the Git Flow plugin cannot finish branches with other prefixes (such as `fix/`).
- `release/v<MAJOR.MINOR.PATCH>`: Release preparation (from `develop`, merged to `main` and `develop`).
- `hotfix/v<MAJOR.MINOR.PATCH>`: Urgent fixes of a released version (from `main`, merged to `main` and `develop`).

Before starting a branch, update `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/<context>-<short-description>
```

Every member makes their own commits. Do not commit changes of another member's bounded context without agreeing first.

---

## Conventional Commits

Commit messages follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification.

### Commit Format
```text
<type>(<scope>): <short summary in imperative mood>

[optional body explaining why the change was made]

[optional footer, such as BREAKING CHANGE]
```

### Commit Types
| Type       | Description                                                  |
|------------|--------------------------------------------------------------|
| `feat`     | A new feature (view, component, entity, command, endpoint)   |
| `fix`      | A bug fix                                                    |
| `docs`     | Documentation only (README, CHANGELOG, diagrams)             |
| `style`    | Formatting or styles that do not change behavior             |
| `refactor` | Code changes that neither fix a bug nor add a feature        |
| `perf`     | Performance improvements                                     |
| `test`     | Adding or updating unit tests                                |
| `build`    | Build configuration or dependency changes                    |
| `ci`       | Continuous integration configuration                         |
| `chore`    | Maintenance tasks (dependencies, deployment configuration)   |

### Allowed Scopes
The scope is the bounded context or the area changed: `shared`, `farming`, `crop`, `profiles`, `certification`, `iam`, `subscriptions`, `i18n`, `api`, `deps`, `config`.

### Examples
- `feat(farming): add campaign finances and field expense views with their routes`
- `fix(crop): correct map initialization`
- `refactor(shared): split the layout into shell, sidebar and toolbar`
- `fix(crop): complete field inspections with POST`
- `docs: add changelog and contributing guidelines`

---

## Semantic Versioning (SemVer)

Versions follow [SemVer 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`. Every release is described in [`CHANGELOG.md`](CHANGELOG.md).

- **MAJOR (`X.0.0`)**: Incompatible changes, for example following a new major version of the RESTful API or restructuring the routes.
- **MINOR (`0.X.0`)**: New backwards-compatible features, such as new views or a new bounded context.
- **PATCH (`0.0.X`)**: Backwards-compatible bug fixes.

---

## TypeScript Guidelines

- **Strict Type Checking**: Keep `strict: true` in `tsconfig.json`.
- **Avoid `any`**: Use interfaces, generics or `unknown` with type narrowing.
- **Naming Conventions**:
  - `PascalCase`: Classes, interfaces, types, enums and components (`FieldPlot`, `BaseEntity`, `PlotCard`).
  - `camelCase`: Properties, methods, functions, variables and signals (`plotId`, `loadMyPlots`, `selectedPlot`).
  - `UPPER_SNAKE_CASE`: Constants (`FREE_PLAN_PLOT_QUOTA`, `MINIMUM_VERTICES`).
  - `kebab-case`: File and folder names (`field-plot.entity.ts`, `plot-boundary-map-view/`).
- **File suffixes**: `*.entity.ts` (entities), `*.command.ts` (commands), `*.store.ts` (store), `*-api.ts` (API facade), `*.endpoint.ts`, `*.assembler.ts`, `*.response.ts` and `*.routes.ts`.
- **Comments**: Short and direct. Use section comments (`// Store state`, `// UI state`, `// Actions`) and one-line `/** */` comments only when the name is not enough. Keep the user story (`US-xx`) in the class comment.

---

## Angular & Angular Material Standards

### Angular Modern Conventions
- **Standalone Components**: No `NgModule`. Every component, pipe and directive is standalone.
- **Dependency Injection**: Use `inject(Service)` instead of constructor injection.
- **Reactivity via Signals**: Use `signal()`, `computed()` and `effect()` in stores and components, and `toSignal()` to bring RxJS streams into the view.
- **Component APIs**: Use `input()`, `input.required()` and `output()`. Route data and parameters reach the views as inputs through `withComponentInputBinding()`.
- **Routing**: Each bounded context exports its routes from `<context>.routes.ts`, loaded lazily from `app.routes.ts` inside the layout shell. The shell route uses `iamGuard` (session and `data.roles`), `roleGuard` and `activeSubscriptionGuard`; IAM pages live under `/iam`.
- **Reactive Forms**: Use typed reactive forms (`FormBuilder`, `FormControl<T>`). Forms live in `presentation/components` and emit their data; the view creates the command and calls the store.
- **Views stay small**: Views arrange components; repeated markup goes to a component (for example, `PageHeader` and `MessageCard` in `shared/presentation/components`).

### Angular Material (M3) Guidelines
- **Theme Consistency**: Use Material 3 design tokens (`var(--mat-sys-*)`); do not hardcode colors.
- **Global Styles**: Keep global styles in `src/styles.css`; component styles stay in their own `.css` file.
- **Accessibility (a11y)**:
  - Interactive elements need a visible label or an `aria-label`.
  - Images need an `alt` text.
  - Keep the color contrast of WCAG 2.1 AA.

### Internationalization (i18n)
- Do not hardcode UI text in templates or code.
- Translations are split by bounded context: `public/i18n/{en,es}/<context>.json` (`shared`, `farming`, `crop`, `profiles`, `certification`, `subscriptions`, `iam`).
- Add every key in **English and Spanish**. The application starts in English.
- Use the `translate` pipe: `{{ 'farming.plots.title' | translate }}`.

---

## RESTful API & Environments

The data comes from the **SumaqAgro Platform** RESTful API (`sumaq-agro-platform`):
- `src/environments/environment.development.ts` points to `http://localhost:8080/api/v1`; `src/environments/environment.ts` points to the platform deployed on Render. Every resource path lives in the environment files.
- Every request carries the JWT of the session (`iamInterceptor`). Errors follow RFC 9457 problem details; show their `detail` when it explains what the user must fix.
- Only call endpoints the platform serves. When a view needs data that no endpoint returns, compose it in the store from real endpoints (a read model) or ask the platform team for a query; never invent data in the frontend.
- A change in the API contract only touches the `infrastructure` layer (endpoints, requests, responses, assemblers); views, stores and entities stay the same.

---

## Quality Assurance & Development Workflow

### Prerequisites
- Node.js 20.19+, 22.12+ or 24+
- npm 10+

### Development Commands
```bash
# Install dependencies
npm install

# Start the SumaqAgro Platform on http://localhost:8080 first (see its README)

# Application on http://localhost:4200
npm start

# Run unit tests (Vitest)
npm test

# Build the production bundle (dist/sumaqAgro-appweb/browser)
npm run build
```

### Deployment
- **Web application**: Firebase Hosting (`npm run build` and then `firebase deploy --only hosting`).
- **RESTful API**: the SumaqAgro Platform on Render, deployed from its own repository.

---

## Pull Request (PR) Process

Before merging into `develop`, verify that:
1. [ ] The code respects the DDD layers and the dependency rules above.
2. [ ] Commit messages follow Conventional Commits.
3. [ ] Every new UI text has English and Spanish translations.
4. [ ] Unit tests pass (`npm test`).
5. [ ] The production build succeeds without errors (`npm run build`).
6. [ ] Every endpoint called exists in the SumaqAgro Platform.
7. [ ] Class diagrams and `CHANGELOG.md` are updated when the architecture or the features change.
8. [ ] The branch targets `develop` (or `main` for hotfixes).
