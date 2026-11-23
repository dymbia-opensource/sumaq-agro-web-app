import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import {
  catchError,
  Observable,
  defer,
  Subscription,
  forkJoin,
  map,
  of,
  retry,
  switchMap,
  throwError,
} from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { SessionParticipant } from '../../iam/application/iam.store';
import { FarmingStore } from '../../farming/application/farming.store';
import { PlotSummary } from '../../farming/domain/model/entities/plot-summary';
import { ProfilesStore } from '../../profiles/application/profiles.store';
import { AdvisorSummary } from '../../profiles/domain/model/entities/advisor-summary';
import { CropApi } from '../infrastructure/crop-api';
import { RecordPestReportCommand } from '../domain/model/commands/record-pest-report.command';
import { ScheduleFieldInspectionCommand } from '../domain/model/commands/schedule-field-inspection.command';
import { IssueTechnicalPrescriptionCommand } from '../domain/model/commands/issue-technical-prescription.command';
import { AgroclimaticAlert } from '../domain/model/entities/agroclimatic-alert.entity';
import { ClimateForecast } from '../domain/model/entities/climate-forecast.entity';
import { PestReport } from '../domain/model/entities/pest-report.entity';
import { FieldInspection } from '../domain/model/entities/field-inspection.entity';
import { SatelliteObservation } from '../domain/model/entities/satellite-observation.entity';
import { TechnicalPrescription } from '../domain/model/entities/technical-prescription.entity';
import { todayInLima } from '../../shared/infrastructure/api-date';
import { RegionalBulletin } from '../domain/model/entities/regional-bulletin';
import { requireDate, requireText } from '../domain/model/validation';

/** Coordinates scoped data and participant permissions. Production authorization belongs to the API. */
@Injectable({ providedIn: 'root' })
export class CropStore {
  private readonly api = inject(CropApi);
  private readonly profiles = inject(ProfilesStore);
  private readonly farming = inject(FarmingStore);
  private readonly session = inject(IamStore);
  private readonly requests = new Map<string, Subscription>();
  private readonly busy = signal<Record<string, boolean>>({});
  private readonly errors = signal<Record<string, string | null>>({});
  private readonly plotsSignal = signal<PlotSummary[]>([]);
  private readonly advisorSignal = signal<AdvisorSummary | null>(null);
  private readonly advisorsSignal = signal<AdvisorSummary[]>([]);
  private readonly scopeUser = signal<SessionParticipant | null>(null);
  private readonly ready = signal(false);
  private epoch = 0;
  private readonly observationsSignal = signal<SatelliteObservation[]>([]);
  private readonly reportsSignal = signal<PestReport[]>([]);
  private readonly alertsSignal = signal<AgroclimaticAlert[]>([]);
  private readonly forecastsSignal = signal<ClimateForecast[]>([]);
  private readonly bulletinsSignal = signal<RegionalBulletin[]>([]);
  private readonly inspectionsSignal = signal<FieldInspection[]>([]);
  private readonly prescriptionsSignal = signal<TechnicalPrescription[]>([]);
  /** Names of the producers and agronomists shown in the views, by user id. */
  private readonly namesSignal = signal<ReadonlyMap<number, string>>(new Map());
  private readonly requestedNames = new Set<number>();

  readonly activeUser = this.session.activeUser;
  readonly scopeReady = computed(() => this.ready() && this.scopeUser() === this.activeUser());
  readonly plots = computed(() => (this.scopeReady() ? this.plotsSignal() : []));
  readonly selectedPlot = computed(() =>
    this.plots().find((plot) => plot.id === this.farming.selectedPlotId()),
  );
  readonly observations = computed(() =>
    this.scopeReady()
      ? this.observationsSignal().filter((item) => item.plotId === this.selectedPlot()?.id)
      : [],
  );
  readonly latestObservation = computed(() => this.observations()[0] ?? null);
  readonly pestReports = computed(() =>
    this.scopeReady()
      ? this.reportsSignal().filter(
          (report) =>
            this.plots().some((plot) => plot.id === report.plotId) &&
            (!this.canReport() || report.reporterId === this.activeUser()?.id),
        )
      : [],
  );
  readonly alerts = computed(() =>
    this.scopeReady()
      ? this.alertsSignal().filter((item) => item.region === this.selectedPlot()?.region)
      : [],
  );
  readonly forecasts = computed(() =>
    this.forecastsSignal().filter((item) => item.region === this.selectedPlot()?.region),
  );
  readonly bulletins = computed(() =>
    this.bulletinsSignal().filter((item) => item.region === this.selectedPlot()?.region),
  );
  readonly inspections = computed(() =>
    this.scopeReady()
      ? this.inspectionsSignal().filter((inspection) =>
          this.pestReports().some((report) => report.id === inspection.reportId),
        )
      : [],
  );
  readonly prescriptions = computed(() =>
    this.scopeReady()
      ? this.prescriptionsSignal().filter((prescription) =>
          this.pestReports().some((report) => report.id === prescription.reportId),
        )
      : [],
  );
  readonly advisors = computed(() => (this.scopeReady() ? this.advisorsSignal() : []));
  readonly currentAdvisor = computed(() => (this.scopeReady() ? this.advisorSignal() : null));
  readonly canReport = computed(() => this.activeUser()?.experience === 'FARMER');
  readonly canSchedule = computed(() =>
    ['AGRONOMIST', 'COOPERATIVE_DIRECTOR'].includes(this.activeUser()?.experience ?? ''),
  );
  readonly canPrescribe = computed(
    () =>
      this.activeUser()?.experience === 'AGRONOMIST' &&
      this.currentAdvisor()?.userId === this.activeUser()?.id,
  );
  readonly saving = computed(() => !!this.busy()['write']);
  readonly loading = computed(() =>
    Object.entries(this.busy()).some(([key, value]) => key !== 'write' && value),
  );
  readonly scopeLoading = computed(() => !!this.busy()['scope']);
  readonly clinicalLoading = computed(() => !!this.busy()['clinical'] || this.scopeLoading());
  readonly observationsLoading = computed(
    () => !!this.busy()['observations'] || this.scopeLoading(),
  );
  readonly alertsLoading = computed(() => !!this.busy()['alerts'] || this.scopeLoading());
  readonly scopeError = computed(() => this.errors()['scope'] ?? null);
  readonly clinicalError = computed(() => this.scopeError() ?? this.errors()['clinical'] ?? null);
  readonly observationsError = computed(
    () => this.scopeError() ?? this.errors()['observations'] ?? null,
  );
  readonly alertsError = computed(() => this.scopeError() ?? this.errors()['alerts'] ?? null);
  readonly forecastsLoading = computed(() => !!this.busy()['forecasts']);
  readonly forecastsError = computed(() => this.errors()['forecasts'] ?? null);
  readonly bulletinsLoading = computed(() => !!this.busy()['bulletins']);
  readonly bulletinsError = computed(() => this.errors()['bulletins'] ?? null);
  readonly importingObservation = computed(() => !!this.busy()['satellite-import']);
  readonly importError = computed(() => this.errors()['satellite-import'] ?? null);
  readonly importingForecast = computed(() => !!this.busy()['forecast-import']);
  readonly forecastImportError = computed(() => this.errors()['forecast-import'] ?? null);
  readonly writeError = computed(() => this.errors()['write'] ?? null);
  readonly error = computed(() => Object.values(this.errors()).find((value) => value) ?? null);
  readonly pendingPestReportsCount = computed(
    () => this.pestReports().filter((report) => report.status === 'PENDING').length,
  );
  readonly treatableReports = computed(() =>
    this.pestReports().filter(
      (report) =>
        report.status === 'INSPECTED' &&
        !this.prescriptions().some((rx) => rx.reportId === report.id),
    ),
  );
  readonly schedulableReports = computed(() =>
    this.pestReports().filter(
      (report) =>
        report.status === 'PENDING' &&
        !this.inspections().some((inspection) => inspection.reportId === report.id),
    ),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.reset());
    effect(() => {
      const user = this.activeUser();
      this.farming.plotChanges();
      untracked(() => this.loadScope(user));
    });
    effect(() => {
      this.farming.selectedPlotId();
      untracked(() => this.clearPlotData());
    });
    // Read model of names: every person shown in a plot, report, visit or
    // prescription is looked up once in Profiles.
    effect(() => {
      const ids = [
        ...this.plots().map((plot) => plot.ownerUserId),
        ...this.pestReports().map((report) => report.reporterId),
        ...this.inspections().map((inspection) => inspection.inspectorUserId),
        ...this.prescriptions().map((prescription) => prescription.agronomistId),
      ];
      untracked(() => this.loadNames(ids));
    });
  }

  /** Looks up the names that are not known yet. */
  private loadNames(ids: readonly (number | null | undefined)[]): void {
    for (const id of new Set(ids)) {
      if (typeof id !== 'number' || id <= 0 || this.requestedNames.has(id)) continue;
      this.requestedNames.add(id);
      this.profiles.advisorByUser(id).subscribe((summary) => {
        if (summary?.name)
          this.namesSignal.update((names) => new Map(names).set(id, summary.name));
      });
    }
  }

  private loadScope(user: SessionParticipant | null): void {
    this.reset();
    if (!user) return;
    this.scopeUser.set(user);
    const result =
      user.experience === 'FARMER'
        ? this.farming.plotSummariesByOwner(user.id).pipe(
            map((plots) => ({
              plots,
              advisors: [] as AdvisorSummary[],
              advisor: null as AdvisorSummary | null,
            })),
          )
        : user.experience === 'AGRONOMIST'
          ? this.profiles
              .advisorByUser(user.id)
              .pipe(
                switchMap((advisor) =>
                  advisor
                    ? this.advisorScope(advisor, user.id)
                    : throwError(() => new Error('crop.errors.advisor-not-assigned')),
                ),
              )
          : this.profiles
              .cooperativeByDirector(user.id)
              .pipe(
                switchMap((cooperative) =>
                  cooperative
                    ? this.cooperativeScope(cooperative.id as number, null)
                    : throwError(() => new Error('crop.errors.no-cooperative')),
                ),
              );
    this.read(
      'scope',
      result.pipe(retry(2)),
      (data) => {
        this.plotsSignal.set(data.plots);
        this.advisorsSignal.set(data.advisors);
        this.advisorSignal.set(data.advisor);
        this.ready.set(true);
        const selected =
          data.plots.find((plot) => plot.id === this.farming.selectedPlotId()) ?? data.plots[0];
        this.farming.selectPlotId(selected?.id ?? null);
      },
      'crop.errors.load-plots',
    );
  }

  /** Resolves explicit active plot grants without requiring a cooperative membership. */
  private advisorScope(advisor: AdvisorSummary, userId: number) {
    return this.profiles.responsibilitiesByAdvisor(userId).pipe(
      switchMap((records) => {
        const active = records.filter(
          (item) => item.advisorUserId === userId && item.status === 'ACTIVE',
        );
        if (new Set(active.map((item) => item.plotId)).size !== active.length)
          throw new Error('crop.errors.assignment-conflict');
        return (
          active.length
            ? this.farming.plotSummariesByIds(active.map((item) => item.plotId))
            : of([] as PlotSummary[])
        ).pipe(
          map((plots) => ({
            plots: plots.filter((plot) =>
              active.some(
                (item) => item.plotId === plot.id && item.producerUserId === plot.ownerUserId,
              ),
            ),
            advisors: [advisor],
            advisor,
          })),
        );
      }),
    );
  }

  /** Rechecks the current grant before each professional write, including partial-write retries. */
  private withResponsibility<T>(reportId: number, operation: () => Observable<T>): Observable<T> {
    const user = this.activeUser();
    const report = this.report(reportId);
    if (user?.experience !== 'AGRONOMIST') return defer(operation);
    return this.profiles.responsibilityByPlot(report.plotId).pipe(
      switchMap((assignment) => {
        const plot = this.plots().find((item) => item.id === report.plotId);
        if (
          user !== this.activeUser() ||
          !this.scopeReady() ||
          !plot ||
          assignment?.status !== 'ACTIVE' ||
          assignment.advisorUserId !== user.id ||
          assignment.producerUserId !== plot.ownerUserId ||
          report.reporterId !== plot.ownerUserId
        ) {
          this.plotsSignal.update((items) => items.filter((item) => item.id !== report.plotId));
          this.denied();
        }
        return defer(operation);
      }),
    );
  }

  /** Name of a producer, from its profile; the account id while it loads. */
  producerName(userId: number): string {
    const user = this.session.activeUser();
    if (user?.id === userId) return user.displayName;
    return this.namesSignal().get(userId) ?? `#${userId}`;
  }

  private cooperativeScope(cooperativeId: number, advisor: AdvisorSummary | null) {
    return this.profiles.cooperativeScope(cooperativeId).pipe(
      switchMap(({ plotIds, advisors }) => {
        const plots = plotIds.length
          ? this.farming.plotSummariesByIds(plotIds)
          : of([] as PlotSummary[]);
        return plots.pipe(map((plots) => ({ plots, advisors, advisor })));
      }),
    );
  }

  /** Retries failed scope resolution; views reload their data once the scope is ready. */
  retryScope(): void {
    const user = this.activeUser();
    this.loadScope(user);
  }

  selectPlot(plotId: number): void {
    if (!this.plots().some((plot) => plot.id === plotId)) return;
    this.farming.selectPlotId(plotId);
  }

  /** Shared selection changes invalidate pending reads, including changes from another context. */
  private clearPlotData(): void {
    this.requests.get('observations')?.unsubscribe();
    this.requests.get('alerts')?.unsubscribe();
    for (const key of ['forecasts', 'bulletins', 'satellite-import', 'forecast-import']) {
      this.requests.get(key)?.unsubscribe();
      this.setBusy(key, false);
      this.setError(key, null);
    }
    this.forecastsSignal.set([]);
    this.bulletinsSignal.set([]);
    this.setBusy('observations', false);
    this.setBusy('alerts', false);
    this.observationsSignal.set([]);
    this.alertsSignal.set([]);
    this.setError('observations', null);
    this.setError('alerts', null);
  }

  loadObservations(plotId: number): void {
    this.observationsSignal.set([]);
    if (!this.plots().some((plot) => plot.id === plotId && plot.hasPolygon)) return;
    this.read(
      'observations',
      this.api.getObservationsByPlot(plotId).pipe(retry(2)),
      (data) => {
        const plot = this.plots().find((plot) => plot.id === plotId);
        if (!plot) return;
        if (data.some((observation) => observation.plotId !== plotId)) {
          throw new Error('crop.errors.invalid-data');
        }
        this.observationsSignal.set(
          [...data].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
        );
      },
      'crop.errors.load-observations',
    );
  }

  loadAlerts(region: string): void {
    this.alertsSignal.set([]);
    if (!this.plots().some((plot) => plot.region === region)) return;
    this.read(
      'alerts',
      this.api.getAlertsByRegion(region).pipe(retry(2)),
      (data) => this.alertsSignal.set(data.filter((alert) => alert.region === region)),
      'crop.errors.load-alerts',
    );
  }

  canImportObservation(): boolean {
    const plot = this.selectedPlot();
    return this.scopeReady() && !!plot?.hasPolygon && plot.ownerUserId === this.activeUser()?.id;
  }

  importLatestObservation(): void {
    const plot = this.selectedPlot();
    if (!plot || !this.canImportObservation() || this.importingObservation()) return;
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.read(
      'satellite-import',
      this.api
        .importObservation(plot.id, from.toISOString(), now.toISOString())
        .pipe(
          catchError((error: unknown) =>
            throwError(() =>
              error instanceof HttpErrorResponse &&
              error.status === 404 &&
              error.error?.code === 'SATELLITEOBSERVATION_NOT_FOUND'
                ? new Error('crop.errors.no-satellite-in-range')
                : error,
            ),
          ),
        ),
      () => this.loadObservations(plot.id),
      'crop.errors.import-observations',
    );
  }

  /** Only the owner can import the forecast, and only for a plot with its monitoring polygon. */
  canImportForecast(): boolean {
    return this.canImportObservation();
  }

  /**
   * Imports the 5-day forecast of the selected plot from AgroMonitoring. The
   * platform also issues the frost or water stress alerts of the region, so
   * the alerts are read again afterwards.
   */
  importForecasts(): void {
    const plot = this.selectedPlot();
    if (!plot || !this.canImportForecast() || this.importingForecast()) return;
    this.read(
      'forecast-import',
      this.api.importForecasts(plot.id).pipe(
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof HttpErrorResponse && error.status === 404
              ? new Error('crop.errors.no-forecast-available')
              : error,
          ),
        ),
      ),
      (imported) => {
        const others = this.forecastsSignal().filter(
          (item) => !imported.some((forecast) => forecast.forecastDate === item.forecastDate),
        );
        this.forecastsSignal.set(
          [...others, ...imported].sort(
            (a, b) => Date.parse(a.forecastDate) - Date.parse(b.forecastDate),
          ),
        );
        this.loadAlerts(plot.region);
      },
      'crop.errors.import-forecasts',
    );
  }

  loadRegionalData(region: string): void {
    this.loadAlerts(region);
    if (!this.plots().some((plot) => plot.region === region)) return;
    this.read(
      'forecasts',
      this.api.getForecastsByRegion(region),
      (items) =>
        this.forecastsSignal.set(
          [...items].sort((a, b) => Date.parse(a.forecastDate) - Date.parse(b.forecastDate)),
        ),
      'crop.errors.load-forecasts',
    );
    this.loadBulletins(region);
  }

  private loadBulletins(region: string): void {
    this.read(
      'bulletins',
      this.api.getBulletinsByRegion(region),
      (items) =>
        this.bulletinsSignal.set(
          [...items].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
        ),
      'crop.errors.load-bulletins',
    );
  }

  publishBulletin(title: string, content: string, onSaved: () => void): void {
    const plot = this.selectedPlot();
    const agronomistId = this.activeUser()?.id;
    this.mutate(
      () => {
        if (!this.canPrescribe() || !plot || agronomistId === undefined) this.denied();
        requireText(title);
        requireText(content);
        return this.api.publishBulletin({
          agronomistId,
          region: plot.region,
          title: title.trim(),
          content: content.trim(),
        });
      },
      () => {
        if (this.selectedPlot()?.region === plot?.region) this.loadBulletins(plot!.region);
      },
      onSaved,
      () => {},
      'crop.errors.save-bulletin',
    );
  }

  loadClinicalData(onLoaded?: () => void): void {
    if (!this.scopeReady()) return;
    const plots = this.plots();
    const data = plots.length
      ? forkJoin(
          plots.map((plot) =>
            forkJoin({
              reports: this.api.getPestReportsByPlot(plot.id),
              inspections: this.api.getInspectionsByPlot(plot.id),
              prescriptions: this.api.getPrescriptionsByPlot(plot.id),
            }).pipe(
              map((items) => {
                const reports = items.reports
                  .filter(
                    (report) =>
                      report.plotId === plot.id &&
                      report.reporterId === plot.ownerUserId &&
                      (!this.canReport() || report.reporterId === this.activeUser()?.id),
                  )
                  .map((report) => this.withPlotName(report, plot.name));
                const ids = new Set(reports.map((report) => report.id));
                return {
                  reports,
                  inspections: items.inspections.filter(
                    (item) => item.plotId === plot.id && ids.has(item.reportId),
                  ),
                  prescriptions: items.prescriptions.filter(
                    (item) => item.plotId === plot.id && ids.has(item.reportId),
                  ),
                };
              }),
            ),
          ),
        )
      : of([]);
    this.read(
      'clinical',
      data,
      (groups) => {
        this.reportsSignal.set(groups.flatMap((item) => item.reports));
        this.inspectionsSignal.set(groups.flatMap((item) => item.inspections));
        this.prescriptionsSignal.set(groups.flatMap((item) => item.prescriptions));
        onLoaded?.();
      },
      'crop.errors.load-workflow',
    );
  }

  recordReport(command: RecordPestReportCommand, onSaved: () => void, onFailure: () => void): void {
    this.mutate(
      () => {
        const user = this.activeUser();
        const plot = this.plots().find((plot) => plot.id === command.plotId);
        if (
          !this.canReport() ||
          !user ||
          !plot ||
          plot.ownerUserId !== user.id ||
          command.reporterId !== user.id
        )
          this.denied();
        new PestReport({ ...command });
        return this.api
          .recordReport(command)
          .pipe(map((report) => this.withPlotName(report, plot.name)));
      },
      (report) => this.reportsSignal.update((items) => [...items, report]),
      onSaved,
      onFailure,
      'crop.errors.save-report',
    );
  }

  scheduleInspection(
    command: ScheduleFieldInspectionCommand,
    onSaved: () => void,
    onFailure: () => void,
  ): void {
    this.mutate(
      () => {
        if (!this.canSchedule()) this.denied();
        if (this.report(command.reportId).status !== 'PENDING')
          throw new Error('crop.errors.invalid-transition');
        requireDate(command.scheduledAt);
        if (Date.parse(command.scheduledAt) <= Date.now())
          throw new Error('crop.errors.future-visit');
        if (this.inspections().some((item) => item.reportId === command.reportId))
          throw new Error('crop.errors.visit-already-scheduled');
        const report = this.report(command.reportId);
        return this.profiles.responsibilityByPlot(report.plotId).pipe(
          switchMap((assignment) => {
            const user = this.activeUser();
            if (
              !assignment ||
              assignment.status !== 'ACTIVE' ||
              assignment.producerUserId !== report.reporterId
            ) {
              throw new Error('crop.errors.assign-before-visit');
            }
            if (!user || (user.experience === 'AGRONOMIST' && assignment.advisorUserId !== user.id))
              this.denied();
            return this.api.scheduleInspection(command, assignment.advisorUserId);
          }),
        );
      },
      (inspection) => this.inspectionsSignal.update((items) => [...items, inspection]),
      onSaved,
      onFailure,
      'crop.errors.save-inspection',
    );
  }

  completeInspection(
    id: number,
    findings: string,
    onSaved: () => void,
    onFailure: () => void,
  ): void {
    this.mutate(
      () => {
        const inspection = this.inspections().find((item) => item.id === id);
        if (!inspection || !this.canComplete(inspection)) this.denied();
        requireText(findings, 10);
        if (Date.parse(inspection.scheduledAt) > Date.now())
          throw new Error('crop.errors.visit-not-due');
        return this.withResponsibility(inspection.reportId, () =>
          this.api.completeInspection(id, findings.trim()),
        );
      },
      (inspection) => {
        this.inspectionsSignal.update((items) =>
          items.map((item) => (item.id === id ? inspection : item)),
        );
        const plot = this.plots().find((item) => item.id === inspection.plotId);
        if (plot) {
          this.read(
            'inspection-report',
            this.api.getPestReport(inspection.reportId),
            (report) => {
              if (report.plotId !== plot.id || report.status === 'PENDING') {
                throw new Error('crop.errors.inspection-status-partial');
              }
              this.replaceReport(this.withPlotName(report, plot.name));
            },
            'crop.errors.inspection-status-partial',
          );
        }
      },
      onSaved,
      onFailure,
      'crop.errors.complete-inspection',
    );
  }

  readonly inspectionReportError = computed(() => this.errors()['inspection-report'] ?? null);

  issuePrescription(
    command: IssueTechnicalPrescriptionCommand,
    onSaved: () => void,
    onFailure: () => void,
  ): void {
    this.mutate(
      () => {
        if (!this.canPrescribe() || command.agronomistId !== this.activeUser()?.id) this.denied();
        if (this.report(command.reportId).status !== 'INSPECTED')
          throw new Error('crop.errors.inspection-required');
        requireDate(command.applicationDate);
        if (command.applicationDate < todayInLima())
          throw new Error('crop.errors.past-application');
        requireText(command.product);
        requireText(command.dosage);
        requireText(command.instructions);
        if (this.prescriptions().some((rx) => rx.reportId === command.reportId)) {
          throw new Error('crop.errors.invalid-transition');
        }
        return this.withResponsibility(command.reportId, () => this.api.issuePrescription(command));
      },
      (prescription) => this.prescriptionsSignal.update((items) => [...items, prescription]),
      onSaved,
      onFailure,
      'crop.errors.save-prescription',
    );
  }

  canApplyPrescription(prescription: TechnicalPrescription): boolean {
    const user = this.activeUser();
    return (
      this.canReport() &&
      prescription.status === 'ISSUED' &&
      this.pestReports().some(
        (report) =>
          report.id === prescription.reportId &&
          report.plotId === prescription.plotId &&
          report.reporterId === user?.id,
      )
    );
  }

  applyPrescription(id: number, onSaved: () => void = () => {}): void {
    this.mutate(
      () => {
        const prescription = this.prescriptions().find((rx) => rx.id === id);
        if (!prescription || !this.canApplyPrescription(prescription)) this.denied();
        return this.api.applyPrescription(id);
      },
      (saved) =>
        this.prescriptionsSignal.update((items) => items.map((rx) => (rx.id === id ? saved : rx))),
      onSaved,
      () => {},
      'crop.errors.apply-prescription',
    );
  }

  canDeleteReport(id: number): boolean {
    const report = this.pestReports().find((item) => item.id === id);
    return (
      this.canReport() &&
      !this.clinicalLoading() &&
      !this.clinicalError() &&
      !!report &&
      report.reporterId === this.activeUser()?.id &&
      report.status === 'PENDING' &&
      !this.inspections().some((item) => item.reportId === id) &&
      !this.prescriptions().some((item) => item.reportId === id)
    );
  }

  deleteReport(id: number, onSaved: () => void, onFailure: () => void): void {
    this.mutate(
      () => {
        if (!this.canDeleteReport(id)) this.denied();
        return this.api.deleteReport(id);
      },
      () => this.reportsSignal.update((items) => items.filter((item) => item.id !== id)),
      onSaved,
      onFailure,
      'crop.errors.delete-report',
    );
  }
  clearError(): void {
    this.setError('write', null);
  }
  reportLabel(id: number): string {
    const reports = [...this.pestReports()].sort((a, b) => Number(a.id) - Number(b.id));
    const index = reports.findIndex((item) => Number(item.id) === id);
    return index >= 0 ? '#' + (index + 1) + ' · ' + reports[index].plotName : '#' + id;
  }
  advisorName(id: number): string {
    return (
      this.advisors().find((item) => item.userId === id)?.name ||
      (this.session.activeUser()?.id === id ? this.session.activeUser()?.displayName : undefined) ||
      this.namesSignal().get(id) ||
      '#' + id
    );
  }
  canComplete(inspection: FieldInspection): boolean {
    return (
      this.canPrescribe() &&
      inspection.status === 'SCHEDULED' &&
      inspection.inspectorUserId === this.activeUser()?.id
    );
  }

  private report(id: number): PestReport {
    const report = this.pestReports().find((item) => item.id === id);
    if (!report) this.denied();
    return report!;
  }
  private withPlotName(report: PestReport, plotName: string): PestReport {
    return new PestReport({
      id: report.id,
      plotId: report.plotId,
      plotName,
      reporterId: report.reporterId,
      description: report.description,
      severity: report.severity,
      status: report.status,
      photo: report.photo,
      clientSyncId: report.clientSyncId,
    });
  }
  private replaceReport(report: PestReport): void {
    this.reportsSignal.update((items) =>
      items.map((item) => (item.id === report.id ? report : item)),
    );
  }
  private denied(): never {
    throw new Error('crop.errors.not-authorized');
  }
  private setBusy(key: string, value: boolean): void {
    this.busy.update((items) => ({ ...items, [key]: value }));
  }
  private setError(key: string, value: string | null): void {
    this.errors.update((items) => ({ ...items, [key]: value }));
  }
  private message(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.startsWith('crop.errors.')) return error.message;
    if (error instanceof HttpErrorResponse && [400, 409, 422].includes(error.status)) {
      const detail = error.error?.details || error.error?.detail;
      if (typeof detail === 'string' && detail.trim()) return detail;
    }
    return fallback;
  }

  private read<T>(
    key: string,
    source: Observable<T>,
    onData: (data: T) => void,
    fallback: string,
  ): void {
    this.requests.get(key)?.unsubscribe();
    this.setBusy(key, true);
    this.setError(key, null);
    const epoch = this.epoch;
    const participant = this.activeUser();
    const request = source.subscribe({
      next: (data) => {
        if (epoch !== this.epoch || participant !== this.activeUser()) return;
        this.setBusy(key, false);
        try {
          onData(data);
        } catch (error) {
          this.setError(key, this.message(error, fallback));
        }
      },
      error: (error) => {
        if (epoch === this.epoch && participant === this.activeUser()) {
          this.setBusy(key, false);
          this.setError(key, this.message(error, fallback));
        }
      },
    });
    this.requests.set(key, request);
  }

  private mutate<T>(
    source: () => Observable<T>,
    update: (data: T) => void,
    onSaved: () => void,
    onFailure: () => void,
    fallback: string | (() => string),
  ): void {
    if (this.saving()) {
      onFailure();
      return;
    }
    this.clearError();
    const epoch = this.epoch;
    const participant = this.activeUser();
    try {
      if (!this.scopeReady()) this.denied();
      const operation = source();
      this.setBusy('write', true);
      this.requests.set(
        'write',
        operation.subscribe({
          next: (data) => {
            if (epoch === this.epoch && participant === this.activeUser()) {
              update(data);
              this.setBusy('write', false);
              onSaved();
            }
          },
          error: (error) => {
            if (epoch === this.epoch && participant === this.activeUser()) {
              this.setBusy('write', false);
              this.setError(
                'write',
                this.message(error, typeof fallback === 'string' ? fallback : fallback()),
              );
              onFailure();
            }
          },
        }),
      );
    } catch (error) {
      this.setBusy('write', false);
      this.setError(
        'write',
        this.message(error, typeof fallback === 'string' ? fallback : fallback()),
      );
      onFailure();
    }
  }

  private reset(): void {
    this.epoch++;
    this.requests.forEach((request) => request.unsubscribe());
    this.requests.clear();
    this.busy.set({});
    this.errors.set({});
    this.ready.set(false);
    this.scopeUser.set(null);
    this.plotsSignal.set([]);
    this.advisorsSignal.set([]);
    this.advisorSignal.set(null);
    this.observationsSignal.set([]);
    this.reportsSignal.set([]);
    this.alertsSignal.set([]);
    this.forecastsSignal.set([]);
    this.bulletinsSignal.set([]);
    this.inspectionsSignal.set([]);
    this.prescriptionsSignal.set([]);
  }
}
