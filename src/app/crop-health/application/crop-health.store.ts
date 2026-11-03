import { CaseAssessment, CaseAssessmentData } from '../domain/model/entities/case-assessment';
import { CaseAssessmentsApi } from '../infrastructure/case-assessments.api';
import {
  TreatmentFollowUp,
  TreatmentFollowUpData,
} from '../domain/model/entities/treatment-follow-up';
import { TreatmentFollowUpsApi } from '../infrastructure/treatment-follow-ups.api';
import { computed, DestroyRef, effect, inject, Service, signal, untracked } from '@angular/core';
import {
  Observable,
  defer,
  Subscription,
  forkJoin,
  map,
  of,
  retry,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { SessionContext } from '../../iam/application/session-context';
import { SessionParticipant } from '../../iam/application/session-participant';
import { PlotSelectionService } from '../../field-management/application/plot-selection.service';
import { PlotDirectory, PlotSummary } from '../../field-management/infrastructure/plot-directory';
import { AdvisoryDirectory, AdvisorSummary } from '../../profiles/infrastructure/advisory-directory';
import { CropHealthApi } from '../infrastructure/crop-health-api';
import { RecordPestReportCommand } from '../domain/model/commands/record-pest-report.command';
import { ScheduleFieldInspectionCommand } from '../domain/model/commands/schedule-field-inspection.command';
import { IssueTechnicalPrescriptionCommand } from '../domain/model/commands/issue-technical-prescription.command';
import { AgroclimaticAlert } from '../domain/model/entities/agroclimatic-alert.entity';
import { ClimateForecast } from '../domain/model/entities/climate-forecast.entity';
import { PestReport } from '../domain/model/entities/pest-report.entity';
import { FieldInspection } from '../domain/model/entities/field-inspection.entity';
import { SatelliteObservation } from '../domain/model/entities/satellite-observation.entity';
import { TechnicalPrescription } from '../domain/model/entities/technical-prescription.entity';
import { requireDate, todayInLima } from '../domain/model/validation';

/** Coordinates scoped data and participant permissions. Production authorization belongs to the API. */
@Service()
export class CropHealthStore {
  private readonly api = inject(CropHealthApi);
  private readonly assessmentApi = inject(CaseAssessmentsApi);
  private readonly assessmentsSignal = signal<CaseAssessment[]>([]);
  /** Assessments are visible only through the participant's authorized case list. */
  readonly assessments = computed(() =>
    this.scopeReady()
      ? this.assessmentsSignal().filter((item) =>
          this.pestReports().some((report) => report.id === item.data.reportId),
        )
      : [],
  );
  private readonly followUpApi = inject(TreatmentFollowUpsApi);
  private readonly followUpsSignal = signal<TreatmentFollowUp[]>([]);
  private readonly profiles = inject(AdvisoryDirectory);
  private readonly fields = inject(PlotDirectory);
  private readonly selection = inject(PlotSelectionService);
  private readonly session = inject(SessionContext);
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
  private readonly inspectionsSignal = signal<FieldInspection[]>([]);
  private readonly prescriptionsSignal = signal<TechnicalPrescription[]>([]);

  /** Farmer evidence remains scoped to reports visible to the current participant. */
  readonly followUps = computed(() =>
    this.scopeReady()
      ? this.followUpsSignal().filter((item) =>
          this.pestReports().some(
            (report) =>
              report.id === item.data.reportId && report.reporterId === item.data.producerUserId,
          ),
        )
      : [],
  );
  readonly activeUser = this.session.activeUser;
  readonly scopeReady = computed(
    () =>
      this.ready() &&
      this.scopeUser() === this.activeUser(),
  );
  readonly plots = computed(() =>
    this.scopeReady() ? this.plotsSignal() : [],
  );
  readonly selectedPlot = computed(() =>
    this.plots().find((plot) => plot.id === this.selection.selectedPlotId()),
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
  readonly forecasts = computed(() => (this.scopeReady() ? this.forecastsSignal() : []));
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
  readonly writeError = computed(() => this.errors()['write'] ?? null);
  readonly error = computed(() => Object.values(this.errors()).find((value) => value) ?? null);
  readonly pendingPestReportsCount = computed(
    () => this.pestReports().filter((report) => report.status === 'PENDING').length,
  );
  readonly treatableReports = computed(() =>
    this.pestReports().filter((report) => report.status === 'INSPECTED'),
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
      this.fields.changes();
      untracked(() => this.loadScope(user));
    });
    effect(() => {
      this.selection.selectedPlotId();
      untracked(() => this.clearPlotData());
    });
  }

  private loadScope(user: SessionParticipant | null): void {
    this.reset();
    if (!user) return;
    this.scopeUser.set(user);
    const result =
      user.experience === 'FARMER'
        ? this.fields.getByOwner(user.id).pipe(
            map((plots) => ({
              plots,
              advisors: [] as AdvisorSummary[],
              advisor: null as AdvisorSummary | null,
            })),
          )
        : user.experience === 'AGRONOMIST'
          ? this.profiles
              .getAdvisorByUser(user.id)
              .pipe(
                switchMap((advisor) =>
                  advisor
                    ? this.advisorScope(advisor, user.id)
                    : throwError(() => new Error('crop-health.errors.advisor-not-assigned')),
                ),
              )
          : this.profiles
              .getCooperativeByDirector(user.id)
              .pipe(
                switchMap((cooperative) =>
                  cooperative
                    ? this.cooperativeScope(cooperative.id as number, null)
                    : throwError(() => new Error('crop-health.errors.no-cooperative')),
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
          data.plots.find((plot) => plot.id === this.selection.selectedPlotId()) ?? data.plots[0];
        this.selection.select(selected?.id ?? null);
      },
      'crop-health.errors.load-plots',
    );
  }

  /** Resolves explicit active plot grants without requiring a cooperative membership. */
  private advisorScope(advisor: AdvisorSummary, userId: number) {
    return this.profiles.getByAdvisor(userId).pipe(
      switchMap((records) => {
        const active = records.filter(
          (item) => item.advisorUserId === userId && item.status === 'ACTIVE',
        );
        if (new Set(active.map((item) => item.plotId)).size !== active.length)
          throw new Error('crop-health.errors.assignment-conflict');
        return (
          active.length
            ? this.fields.getByIds(active.map((item) => item.plotId))
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
    return this.profiles.getByPlot(report.plotId).pipe(
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

  /** Uses the current account's display name; other producers remain identifiable by account ID. */
  producerName(userId: number): string {
    const user = this.session.activeUser();
    return user?.id === userId ? user.displayName : `#${userId}`;
  }

  private cooperativeScope(cooperativeId: number, advisor: AdvisorSummary | null) {
    return this.profiles.getCooperativeScope(cooperativeId).pipe(
      switchMap(({ plotIds, advisors }) => {
        const plots = plotIds.length ? this.fields.getByIds(plotIds) : of([] as PlotSummary[]);
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
    this.selection.select(plotId);
  }

  /** Shared selection changes invalidate pending reads, including changes from another context. */
  private clearPlotData(): void {
    this.requests.get('observations')?.unsubscribe();
    this.requests.get('alerts')?.unsubscribe();
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
        if (
          data.some(
            (observation) =>
              observation.plotId !== plotId || observation.stressAreaHectares > plot.areaHectares,
          )
        ) {
          throw new Error('crop-health.errors.invalid-data');
        }
        this.observationsSignal.set(
          [...data].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
        );
      },
      'crop-health.errors.load-observations',
    );
  }

  loadAlerts(region: string): void {
    this.alertsSignal.set([]);
    if (!this.plots().some((plot) => plot.region === region)) return;
    this.read(
      'alerts',
      this.api.getAlertsByRegion(region).pipe(retry(2)),
      (data) => this.alertsSignal.set(data.filter((alert) => alert.region === region)),
      'crop-health.errors.load-alerts',
    );
  }

  loadClinicalData(onLoaded?: () => void): void {
    if (!this.scopeReady()) return;
    const plots = this.plots();
    const reports = plots.length
      ? forkJoin(plots.map((plot) => this.api.getPestReportsByPlot(plot.id as number))).pipe(
          map((groups) => groups.flat()),
        )
      : of([] as PestReport[]);
    this.read(
      'clinical',
      reports.pipe(
        switchMap((reports) => {
          const allowed = reports.filter(
            (report) =>
              plots.some(
                (plot) =>
                  plot.id === report.plotId &&
                  (this.activeUser()?.experience !== 'AGRONOMIST' ||
                    plot.ownerUserId === report.reporterId),
              ) &&
              (!this.canReport() || report.reporterId === this.activeUser()?.id),
          );
          const ids = new Set(allowed.map((report) => report.id));
          if (!ids.size)
            return of({
              reports: allowed,
              inspections: [] as FieldInspection[],
              prescriptions: [] as TechnicalPrescription[],
              followUps: [] as TreatmentFollowUp[],
              assessments: [] as CaseAssessment[],
            });
          return forkJoin({
            assessments: forkJoin([...ids].map((id) => this.assessmentApi.getByReport(Number(id)))),
            inspections: this.api.getInspections(),
            prescriptions: this.api.getPrescriptions(),
            followUps: forkJoin([...ids].map((id) => this.followUpApi.getByReport(Number(id)))),
          }).pipe(
            map((data) => ({
              reports: allowed,
              assessments: data.assessments.flat().filter((item) => ids.has(item.data.reportId)),
              inspections: data.inspections.filter((item) => ids.has(item.reportId)),
              prescriptions: data.prescriptions.filter((item) => ids.has(item.reportId)),
              followUps: data.followUps
                .flat()
                .filter(
                  (item) =>
                    ids.has(item.data.reportId) &&
                    allowed.some(
                      (report) =>
                        report.id === item.data.reportId &&
                        report.reporterId === item.data.producerUserId,
                    ),
                ),
            })),
          );
        }),
        retry(2),
      ),
      (data) => {
        this.reportsSignal.set(data.reports);
        this.inspectionsSignal.set(data.inspections);
        this.prescriptionsSignal.set(data.prescriptions);
        this.followUpsSignal.set(data.followUps);
        this.assessmentsSignal.set(data.assessments);
        onLoaded?.();
      },
      'crop-health.errors.load-workflow',
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
        return this.api.recordReport(
          new RecordPestReportCommand({ ...command, plotName: plot!.name }),
        );
      },
      (report) => this.reportsSignal.update((items) => [...items, report]),
      onSaved,
      onFailure,
      'crop-health.errors.save-report',
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
          throw new Error('crop-health.errors.invalid-transition');
        requireDate(command.scheduledAt);
        if (Date.parse(command.scheduledAt) <= Date.now())
          throw new Error('crop-health.errors.future-visit');
        if (this.inspections().some((item) => item.reportId === command.reportId))
          throw new Error('crop-health.errors.visit-already-scheduled');
        return this.withResponsibility(command.reportId, () =>
          this.api.scheduleInspection(command),
        );
      },
      (inspection) => this.inspectionsSignal.update((items) => [...items, inspection]),
      onSaved,
      onFailure,
      'crop-health.errors.save-inspection',
    );
  }

  completeInspection(id: number, notes: string, onSaved: () => void, onFailure: () => void): void {
    let inspectionSaved = false;
    this.mutate(
      () => {
        const user = this.activeUser();
        const current = this.inspections().find((item) => item.id === id);
        if (!this.canPrescribe() || !user || !current) this.denied();
        const report = this.copyReport(this.report(current!.reportId));
        if (report.status !== 'PENDING') throw new Error('crop-health.errors.invalid-transition');
        const inspection = new FieldInspection({
          id: current!.id,
          reportId: current!.reportId,
          scheduledAt: current!.scheduledAt,
          notes: current!.notes,
          status: current!.status,
          completedAt: current!.completedAt,
          inspectorUserId: current!.inspectorUserId,
        });
        let saved: Observable<FieldInspection>;
        if (inspection.status === 'COMPLETED') {
          if (inspection.inspectorUserId !== user!.id || report.status !== 'PENDING') this.denied();
          saved = of(inspection);
        } else {
          inspection.complete(notes, user!.id);
          saved = defer(() => this.api.updateInspection(inspection));
        }
        return this.withResponsibility(current!.reportId, () => saved).pipe(
          tap((result) => {
            inspectionSaved = true;
            this.inspectionsSignal.update((items) =>
              items.map((item) => (item.id === result.id ? result : item)),
            );
          }),
          switchMap(() => {
            if (report.status !== 'PENDING') return of(report);
            report.markInspected();
            return this.withResponsibility(Number(report.id), () => this.api.updateReport(report));
          }),
        );
      },
      (report) => this.replaceReport(report),
      onSaved,
      onFailure,
      () =>
        inspectionSaved
          ? 'crop-health.errors.inspection-status-partial'
          : 'crop-health.errors.complete-inspection',
    );
  }

  issuePrescription(
    command: IssueTechnicalPrescriptionCommand,
    onSaved: () => void,
    onFailure: () => void,
  ): void {
    this.mutate(
      () => {
        if (!this.canPrescribe() || command.agronomistId !== this.activeUser()?.id) this.denied();
        if (this.report(command.reportId).status !== 'INSPECTED')
          throw new Error('crop-health.errors.inspection-required');
        requireDate(command.applicationDate);
        if (command.applicationDate < todayInLima())
          throw new Error('crop-health.errors.past-application');
        new TechnicalPrescription({ ...command });
        return this.withResponsibility(command.reportId, () => this.api.issuePrescription(command));
      },
      (prescription) => this.prescriptionsSignal.update((items) => [...items, prescription]),
      onSaved,
      onFailure,
      'crop-health.errors.save-prescription',
    );
  }

  /**
   * Records an agronomist's evaluation after rereading the case and farmer evidence.
   * @remarks Recovery requires application and evolution for every prescription. The
   * assessment is persisted first. A failed report update keeps that assessment and
   * reuses its ID when retrying; production must make these writes transactional.
   * @param command - Stable draft ID, conclusion and notes. Author/time derive from the session.
   * @param onSaved - Invoked after the evaluation and any required closure are confirmed.
   * @param onFailure - Retains the form draft for correction or retry.
   */
  recordAssessment(
    command: Pick<CaseAssessmentData, 'id' | 'reportId' | 'outcome' | 'notes'>,
    onSaved: () => void,
    onFailure: () => void,
  ): void {
    let assessmentSaved = false;
    this.mutate(
      () => {
        if (!this.canPrescribe() || this.clinicalLoading() || this.clinicalError()) this.denied();
        const user = this.activeUser()!;
        const current = this.report(command.reportId);
        return this.withResponsibility(command.reportId, () =>
          forkJoin({
            reports: this.api.getPestReportsByPlot(current.plotId),
            prescriptions: this.api.getPrescriptionsByReportId(command.reportId),
            followUps: this.followUpApi.getByReport(command.reportId),
            assessments: this.assessmentApi.getByReport(command.reportId),
          }),
        ).pipe(
          switchMap((data) => {
            const report = data.reports.find(
              (item) =>
                item.id === command.reportId &&
                item.reporterId === current.reporterId &&
                item.plotId === current.plotId,
            );
            if (!report) this.denied();
            const prescriptions = data.prescriptions.filter(
              (item) => item.reportId === command.reportId,
            );
            const evidence = data.followUps.filter(
              (item) =>
                item.data.reportId === command.reportId &&
                item.data.producerUserId === report!.reporterId &&
                prescriptions.some((rx) => rx.id === item.data.prescriptionId) &&
                item.data.occurredOn <= todayInLima(),
            );
            const evolved = prescriptions.filter((rx) =>
              evidence.some(
                (item) =>
                  item.data.prescriptionId === rx.id &&
                  item.data.kind === 'EVOLUTION' &&
                  evidence.some(
                    (application) =>
                      application.data.prescriptionId === rx.id &&
                      application.data.kind === 'APPLICATION' &&
                      application.data.occurredOn >= rx.applicationDate.slice(0, 10) &&
                      application.data.occurredOn <= item.data.occurredOn,
                  ),
              ),
            );
            if (
              !evolved.length ||
              (command.outcome === 'RECOVERED' && evolved.length !== prescriptions.length)
            )
              throw new Error('crop-health.errors.assessment-evidence');
            const existing = data.assessments.find((item) => item.data.id === command.id);
            const assessment = new CaseAssessment({
              ...command,
              agronomistUserId: user.id,
              evidenceIds: evidence.map((item) => item.data.id).sort(),
              recordedAt: existing?.data.recordedAt ?? new Date().toISOString(),
            });
            if (
              existing &&
              (existing.data.agronomistUserId !== user.id ||
                existing.data.outcome !== assessment.data.outcome ||
                existing.data.notes !== assessment.data.notes ||
                JSON.stringify([...existing.data.evidenceIds].sort()) !==
                  JSON.stringify(assessment.data.evidenceIds))
            )
              throw new Error('crop-health.errors.assessment-conflict');
            if (
              report!.status !== 'INSPECTED' &&
              !(existing?.data.outcome === 'RECOVERED' && report!.status === 'RESOLVED')
            )
              throw new Error('crop-health.errors.invalid-transition');
            return this.withResponsibility(command.reportId, () =>
              existing ? of(existing) : this.assessmentApi.record(assessment.data),
            ).pipe(
              tap((saved) => {
                assessmentSaved = true;
                this.assessmentsSignal.update((items) => [
                  ...items.filter((item) => item.data.id !== saved.data.id),
                  saved,
                ]);
              }),
              switchMap((saved) => {
                if (saved.data.outcome !== 'RECOVERED' || report!.status === 'RESOLVED')
                  return of(report!);
                const resolved = this.copyReport(report!);
                resolved.resolve();
                return this.withResponsibility(command.reportId, () =>
                  this.api.updateReport(resolved),
                );
              }),
            );
          }),
        );
      },
      (report) => this.replaceReport(report),
      onSaved,
      onFailure,
      () =>
        assessmentSaved
          ? 'crop-health.errors.assessment-partial'
          : 'crop-health.errors.save-assessment',
    );
  }

  /**
   * Records farmer evidence for a prescription belonging to their own incident.
   * @param command - Stable client ID, prescription, date and notes; account is session-derived.
   * @param onSaved - Called after persisted confirmation in the same session.
   * @param onFailure - Restores editing while preserving the draft for a retry.
   */
  recordFollowUp(
    command: Omit<TreatmentFollowUpData, 'producerUserId' | 'recordedAt'>,
    onSaved: () => void,
    onFailure: () => void,
  ): void {
    this.mutate(
      () => {
        const report = this.report(command.reportId);
        const user = this.activeUser();
        const prescription = this.prescriptions().find(
          (item) => item.id === command.prescriptionId && item.reportId === report.id,
        );
        if (
          !this.canReport() ||
          !user ||
          report.reporterId !== user.id ||
          !this.plots().some((plot) => plot.id === report.plotId && plot.ownerUserId === user.id)
        )
          this.denied();
        if (
          this.clinicalLoading() ||
          this.clinicalError() ||
          report.status !== 'INSPECTED' ||
          !prescription
        )
          throw new Error('crop-health.errors.follow-up-not-ready');
        const evidence = new TreatmentFollowUp({
          ...command,
          producerUserId: user.id,
          recordedAt: new Date().toISOString(),
        });
        if (
          command.occurredOn > todayInLima() ||
          command.occurredOn < prescription.applicationDate.slice(0, 10)
        )
          throw new Error('crop-health.errors.follow-up-date');
        return this.followUpApi.getByReport(command.reportId).pipe(
          switchMap((existing) => {
            if (user !== this.activeUser() || !this.scopeReady()) this.denied();
            const matching = existing.filter(
              (item) =>
                item.data.reportId === command.reportId &&
                item.data.prescriptionId === command.prescriptionId &&
                item.data.producerUserId === user.id,
            );
            const retry = matching.find((item) => item.data.id === evidence.data.id);
            if (retry) {
              if (
                retry.data.kind !== evidence.data.kind ||
                retry.data.occurredOn !== evidence.data.occurredOn ||
                retry.data.notes !== evidence.data.notes
              )
                throw new Error('crop-health.errors.follow-up-conflict');
              return of(retry);
            }
            const application = matching.find((item) => item.data.kind === 'APPLICATION');
            if (command.kind === 'APPLICATION' && application)
              throw new Error('crop-health.errors.application-exists');
            if (
              command.kind === 'EVOLUTION' &&
              (!application || command.occurredOn < application.data.occurredOn)
            )
              throw new Error('crop-health.errors.application-required');
            return this.followUpApi.record(evidence.data);
          }),
        );
      },
      (evidence) =>
        this.followUpsSignal.update((items) => [
          ...items.filter((item) => item.data.id !== evidence.data.id),
          evidence,
        ]),
      onSaved,
      onFailure,
      'crop-health.errors.save-follow-up',
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
      'crop-health.errors.delete-report',
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
      this.advisors().find((item) => item.userId === id)?.name ??
      (this.session.activeUser()?.id === id ? this.session.activeUser()?.displayName : undefined) ??
      '#' + id
    );
  }
  /** Requires producer application and evolution before offering professional evaluation. */
  canAssess(id: number): boolean {
    return (
      this.canPrescribe() &&
      !this.clinicalLoading() &&
      !this.clinicalError() &&
      this.pestReports().some((report) => report.id === id && report.status === 'INSPECTED') &&
      this.prescriptions().some(
        (rx) =>
          rx.reportId === id &&
          this.followUps().some(
            (item) => item.data.prescriptionId === rx.id && item.data.kind === 'APPLICATION',
          ) &&
          this.followUps().some(
            (item) => item.data.prescriptionId === rx.id && item.data.kind === 'EVOLUTION',
          ),
      )
    );
  }
  canComplete(inspection: FieldInspection): boolean {
    return (
      this.canPrescribe() &&
      this.pestReports().some(
        (report) => report.id === inspection.reportId && report.status === 'PENDING',
      ) &&
      (inspection.status === 'SCHEDULED' || inspection.inspectorUserId === this.activeUser()?.id)
    );
  }

  private report(id: number): PestReport {
    const report = this.pestReports().find((item) => item.id === id);
    if (!report) this.denied();
    return report!;
  }
  private copyReport(report: PestReport): PestReport {
    return new PestReport({
      id: report.id,
      plotId: report.plotId,
      plotName: report.plotName,
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
    throw new Error('crop-health.errors.not-authorized');
  }
  private setBusy(key: string, value: boolean): void {
    this.busy.update((items) => ({ ...items, [key]: value }));
  }
  private setError(key: string, value: string | null): void {
    this.errors.update((items) => ({ ...items, [key]: value }));
  }
  private message(error: unknown, fallback: string): string {
    return error instanceof Error && error.message.startsWith('crop-health.errors.')
      ? error.message
      : fallback;
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
    this.followUpsSignal.set([]);
    this.assessmentsSignal.set([]);
    this.forecastsSignal.set([]);
    this.inspectionsSignal.set([]);
    this.prescriptionsSignal.set([]);
  }
}
