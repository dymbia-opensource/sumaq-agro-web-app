import { HttpErrorResponse } from '@angular/common/http';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import {
  catchError,
  tap,
  concatMap,
  forkJoin,
  from,
  map,
  Observable,
  of,
  retry,
  Subscription,
  switchMap,
  throwError,
} from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { FileDownloader } from '../../shared/infrastructure/file-downloader';
import { SubscriptionsStore } from '../../subscriptions/application/subscriptions.store';
import { CostReportPdf } from '../infrastructure/cost-report-pdf';
import { OfflineSync } from '../infrastructure/offline/offline-sync';
import { PendingOperationType } from '../infrastructure/offline/pending-operation';
import { CloseCropCampaignCommand } from '../domain/model/commands/close-crop-campaign.command';
import { ExportCampaignCostReportCommand } from '../domain/model/commands/export-campaign-cost-report.command';
import { DelineatePlotBoundaryCommand } from '../domain/model/commands/delineate-plot-boundary.command';
import { RecordActualYieldCommand } from '../domain/model/commands/record-actual-yield.command';
import { RecordDailyLaborExpenseCommand } from '../domain/model/commands/record-daily-labor-expense.command';
import { RecordInputExpenseCommand } from '../domain/model/commands/record-input-expense.command';
import { RecordSoilBaselineCommand } from '../domain/model/commands/record-soil-baseline.command';
import { RecordSowingDateCommand } from '../domain/model/commands/record-sowing-date.command';
import { RegisterFieldPlotCommand } from '../domain/model/commands/register-field-plot.command';
import { SelectCropTypeCommand } from '../domain/model/commands/select-crop-type.command';
import { SetExpectedYieldCommand } from '../domain/model/commands/set-expected-yield.command';
import { SpecifySeedVarietyCommand } from '../domain/model/commands/specify-seed-variety.command';
import { StartCropCampaignCommand } from '../domain/model/commands/start-crop-campaign.command';
import { Money } from '../../shared/domain/model/money';
import { CampaignLedger, YieldUnit } from '../domain/model/entities/campaign-ledger.entity';
import {
  CampaignStatus,
  CropCampaign,
  CropType,
} from '../domain/model/entities/crop-campaign.entity';
import { ExpenseCategory, ExpenseEntry } from '../domain/model/entities/expense-entry.entity';
import { FieldPlot, SoilBaseline } from '../domain/model/entities/field-plot.entity';
import { CampaignSummary } from '../domain/model/entities/campaign-summary';
import { PlotSummary } from '../domain/model/entities/plot-summary';
import { FarmingApi } from '../infrastructure/farming-api';
import {
  ExpenseCommand,
  PendingExpenseAssembler,
  PendingExpensePayload,
} from '../infrastructure/assemblers/pending-expense-assembler';

/** Any of the three expenses of the cost ledger (US-37 to US-39). */
export type RecordExpenseCommand = ExpenseCommand;

/**
 * Commands of a new campaign (US-32 to US-34, US-40).
 *
 * @remarks
 * They follow the EventStorming: start the campaign, select the crop, specify
 * the variety and record the sowing date. The campaign does not exist yet, so
 * the `campaignId` and `ledgerId` of these commands are ignored.
 */
export interface CropCampaignSetup {
  start: StartCropCampaignCommand;
  cropType: SelectCropTypeCommand;
  seedVariety: SpecifySeedVarietyCommand;
  sowingDate: RecordSowingDateCommand;
}

/**
 * Holds the Field Management state and coordinates its application behavior.
 *
 * @remarks
 * It keeps the producer's plots with their campaigns and cost ledgers, and the
 * selected plot. The views send commands and read signals; the shown state is
 * only updated with what the API answers. The platform applies the policies of
 * the context (P8 opens the cost ledger when a campaign starts and freezes it
 * when the campaign closes), so the store reloads the ledger after those
 * commands. It also keeps the expenses recorded offline until they are sent.
 */
@Injectable({ providedIn: 'root' })
export class FarmingStore {
  private readonly farmingApi = inject(FarmingApi);
  private readonly session = inject(IamStore);
  private readonly offlineSync = inject(OfflineSync);
  private readonly pendingExpenses = new PendingExpenseAssembler();
  private readonly subscriptions = inject(SubscriptionsStore);
  private readonly fileDownloader = inject(FileDownloader);
  private readonly costReportPdf = inject(CostReportPdf);

  private readonly plotsSignal = signal<FieldPlot[]>([]);
  private readonly campaignsByPlotSignal = signal<Map<number, CropCampaign[]>>(new Map());
  private readonly ledgersByCampaignSignal = signal<Map<number, CampaignLedger | null>>(new Map());
  private readonly plotsLoadingSignal = signal(false);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly selectedPlotIdSignal = signal<number | null>(null);
  private readonly syncingSignal = signal(false);
  private plotsLoad?: Subscription;
  private plotMutation?: Subscription;
  private plotRevision = 0;
  private readonly quotaOwner = signal<number | null>(null);
  private readonly quotaLoaded = signal(false);
  private readonly plotMutationBusy = signal(false);
  private readonly registrationIncompleteSignal = signal(false);
  private readonly planPlotQuota = signal<{ ownerUserId: number; limit: number } | null>(null);

  /** Plots of the producer. */
  readonly plots: Signal<FieldPlot[]> = computed<FieldPlot[]>(() =>
    this.plotsSignal().filter((plot) => plot.ownerUserId === this.currentUserId()),
  );

  /** `true` while the plots of the producer are being loaded. */
  readonly plotsLoading = this.plotsLoadingSignal.asReadonly();

  /** `true` while data is being loaded from or saved to the API. */
  readonly loading = this.loadingSignal.asReadonly();

  /** i18n key of the last error, or `null`. */
  readonly error = this.errorSignal.asReadonly();

  /** `true` while the device has connection. */
  readonly online = this.offlineSync.isOnline;

  /** Expenses recorded offline that are waiting to be synchronized. */
  readonly pendingExpenseCount = this.offlineSync.pendingCountOf(
    PendingOperationType.FIELD_EXPENSE,
  );

  /** `true` while the offline expenses are being synchronized. */
  readonly syncing = this.syncingSignal.asReadonly();

  /** Authenticated producer who owns the plots. */
  readonly currentUserId = computed(() => {
    const user = this.session.activeUser();

    return user?.experience === 'FARMER' ? user.id : null;
  });

  /** Number of plots of the producer. */
  readonly plotCount = computed(() => this.plots().length);

  /** Stores the plan limit for the current producer. */
  setPlanPlotQuota(ownerUserId: number, limit: number | null): void {
    if (ownerUserId !== this.currentUserId()) return;

    this.planPlotQuota.set(
      limit !== null && Number.isSafeInteger(limit) && limit > 0 ? { ownerUserId, limit } : null,
    );
  }

  /** Plots allowed by the plan of the producer, or 0 until Subscriptions answers. */
  readonly plotQuota = computed(() => {
    const quota = this.planPlotQuota();
    return quota && quota.ownerUserId === this.currentUserId() ? quota.limit : 0;
  });

  /** The plots of the producer finished loading, independently of the plan quota. */
  readonly ownedPlotsReady = computed(
    () =>
      this.currentUserId() !== null &&
      this.quotaOwner() === this.currentUserId() &&
      this.quotaLoaded() &&
      !this.plotsLoading(),
  );

  /** Quota is known only after a successful read for the currently selected producer. */
  readonly plotQuotaReady = computed(() => this.ownedPlotsReady() && this.plotQuota() > 0);

  /** Remaining slots never become negative, including legacy accounts above the quota. */
  readonly remainingPlotSlots = computed(() => Math.max(0, this.plotQuota() - this.plotCount()));

  /** Indicates an actual full plan, independently of loading or a failed quota check. */
  readonly plotQuotaReached = computed(
    () => this.plotQuotaReady() && this.plotCount() >= this.plotQuota(),
  );

  /** A saved plot whose initial campaign failed must be reviewed before another registration. */
  readonly registrationIncomplete = this.registrationIncompleteSignal.asReadonly();

  /** `true` only when a loaded producer has a free slot and no operation is in flight (US-22). */
  readonly canRegisterPlot = computed(
    () =>
      this.plotQuotaReady() &&
      this.remainingPlotSlots() > 0 &&
      !this.loading() &&
      !this.plotMutationBusy() &&
      !this.registrationIncomplete(),
  );

  /** Identifier of the plot shown in Field Management and Crop Health, or `null`. */
  readonly selectedPlotId = this.selectedPlotIdSignal.asReadonly();

  /** Plot shown on the dashboard. */
  readonly selectedPlot = computed(() =>
    this.plots().find((plot) => plot.id === this.selectedPlotId()),
  );

  /** Campaigns of the selected plot. */
  readonly campaigns = computed(
    () => this.campaignsByPlotSignal().get(this.selectedPlotId() ?? -1) ?? [],
  );

  /** Campaign in progress of the selected plot, or the most recent one. */
  readonly activeCampaign = computed(() => FarmingStore.currentOf(this.campaigns()));

  /** `true` when the selected plot has a campaign in progress. */
  readonly hasCampaignInProgress = computed(() =>
    this.campaigns().some((campaign) => campaign.isActive()),
  );

  /** Cost ledger of the active campaign of the selected plot, or `null`. */
  readonly ledger = computed(() => {
    const campaign = this.activeCampaign();
    return campaign ? (this.ledgersByCampaignSignal().get(campaign.id as number) ?? null) : null;
  });

  /** Cost ledger of each campaign of the producer, by campaign identifier. */
  readonly ledgersByCampaign = this.ledgersByCampaignSignal.asReadonly();

  /**
   * Creates an instance of FarmingStore. It loads the plots of the
   * producer every time the signed-in user changes, and synchronizes the
   * offline expenses every time the connection comes back.
   */
  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearState());
    effect(() => {
      const userId = this.currentUserId();
      untracked(() => (userId === null ? this.clearState() : this.loadMyPlots(userId)));
    });

    // The plan belongs to Subscriptions; Farming only asks for the limit it answers.
    effect(() => {
      const owner = this.currentUserId();
      untracked(() => {
        if (owner !== null) this.subscriptions.loadMySubscription(owner);
      });
    });
    effect(() => {
      const owner = this.currentUserId();
      const ready = this.subscriptions.plotQuotaReady();
      const quota = this.subscriptions.hasActivePlan() ? this.subscriptions.plotQuota() : null;

      untracked(() => {
        if (owner !== null) this.setPlanPlotQuota(owner, ready ? quota : null);
      });
    });
  }

  /** Asks Subscriptions for the plan limit again, without changing accounts. */
  reloadPlanPlotQuota(): void {
    const owner = this.currentUserId();
    if (owner === null) return;

    this.setPlanPlotQuota(owner, null);
    this.subscriptions.loadMySubscription(owner);
  }

  // ---------- Queries ----------

  /**
   * Selects a plot by identifier.
   * @param id - Plot identifier.
   * @returns Reactive selection for the requested plot.
   */
  getPlotById = (id: number): Signal<FieldPlot | undefined> =>
    computed(() => this.plots().find((plot) => plot.id === id));

  /**
   * Selects the current campaign of a plot: the one in progress, or the most recent.
   * @param plotId - Plot identifier.
   * @returns Reactive selection for the campaign.
   */
  getCurrentCampaignOf = (plotId: number): Signal<CropCampaign | undefined> =>
    computed(() => FarmingStore.currentOf(this.campaignsByPlotSignal().get(plotId) ?? []));

  /**
   * Loads the plots of the producer with their campaigns, and keeps (or selects) the shown plot.
   * @param ownerUserId - Producer who owns the plots.
   */
  loadMyPlots = (ownerUserId: number): void => {
    if (
      ownerUserId !== this.currentUserId() ||
      (this.plotMutationBusy() && this.quotaOwner() === ownerUserId)
    )
      return;
    const revision = ++this.plotRevision;
    this.plotMutation?.unsubscribe();
    this.plotMutationBusy.set(false);
    this.quotaOwner.set(ownerUserId);
    this.quotaLoaded.set(false);
    this.registrationIncompleteSignal.set(false);
    this.plotsLoad?.unsubscribe();
    this.plotsLoadingSignal.set(true);
    this.startLoading();
    this.plotsLoad = this.farmingApi
      .getPlotsByOwner(ownerUserId)
      .pipe(
        retry(2),
        map((plots) => this.ownedPlots(plots, ownerUserId)),
        switchMap((plots) =>
          plots.length === 0
            ? of({ plots, campaigns: [] as CropCampaign[][] })
            : forkJoin(
                plots.map((plot) => this.farmingApi.getCampaignsByPlot(plot.id as number)),
              ).pipe(map((campaigns) => ({ plots, campaigns }))),
        ),
      )
      .subscribe({
        next: ({ plots, campaigns }) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.quotaLoaded.set(true);
          this.plotsLoadingSignal.set(false);
          this.plotsSignal.set(plots);
          this.campaignsByPlotSignal.set(
            new Map(plots.map((plot, index) => [plot.id as number, campaigns[index]])),
          );
          this.ledgersByCampaignSignal.set(new Map());
          campaigns.flat().forEach((campaign) => this.loadLedgerOf(campaign.id as number));
          this.loadingSignal.set(false);
          const keep = plots.some((plot) => plot.id === this.selectedPlotId());
          const first = plots[0];
          if (first) {
            this.selectPlot(keep ? this.selectedPlotId()! : (first.id as number));
          } else {
            this.selectedPlotIdSignal.set(null);
          }
        },
        error: (error) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.quotaLoaded.set(false);
          this.plotsLoadingSignal.set(false);
          this.fail(error, 'farming.errors.load-plots');
        },
      });
  };

  /**
   * Shares the selected plot with Crop Health, which also shows the plots of
   * advisors and cooperatives that are not part of the producer's plots.
   * @param plotId - Plot to show, or `null`.
   */
  selectPlotId = (plotId: number | null): void => this.selectedPlotIdSignal.set(plotId);

  /** Notifies the other contexts after a confirmed plot mutation. */
  readonly plotChanges = this.farmingApi.plotChanges;

  /**
   * Publishes the plots of one producer to the other bounded contexts.
   * @param ownerUserId - Producer who owns the plots.
   * @returns Stream with the published projection of each plot.
   */
  plotSummariesByOwner = (ownerUserId: number): Observable<PlotSummary[]> =>
    this.farmingApi
      .getPlotsByOwner(ownerUserId)
      .pipe(
        map((plots) =>
          plots.filter((plot) => plot.ownerUserId === ownerUserId).map(FarmingStore.toPlotSummary),
        ),
      );

  /**
   * Publishes the requested plots; the ones that no longer exist are skipped.
   * @param ids - Identifiers of the plots to read.
   * @returns Stream with the published projection of each plot.
   */
  plotSummariesByIds = (ids: number[]): Observable<PlotSummary[]> =>
    this.farmingApi
      .getPlotsByIds(ids)
      .pipe(
        map((plots) =>
          plots.filter((plot) => ids.includes(Number(plot.id))).map(FarmingStore.toPlotSummary),
        ),
      );

  /**
   * Publishes the campaign in progress of a plot, or `null` when it has none.
   * @param plotId - Plot of the campaign.
   * @returns Stream with the published projection of the campaign.
   */
  activeCampaignByPlot = (plotId: number): Observable<CampaignSummary | null> =>
    this.farmingApi.getCampaignsByPlot(plotId).pipe(
      map((campaigns) => {
        const campaign = campaigns.find((item) => item.isActive());

        return campaign
          ? Object.freeze({
              id: Number(campaign.id),
              plotId: campaign.plotId,
              season: campaign.season,
              cropType: campaign.cropType,
              seedVariety: campaign.seedVariety,
            })
          : null;
      }),
    );

  /** Copies the plot into the projection other contexts receive. */
  private static toPlotSummary(plot: FieldPlot): PlotSummary {
    return Object.freeze({
      id: Number(plot.id),
      ownerUserId: plot.ownerUserId,
      name: plot.name,
      region: plot.region,
      areaHectares: plot.areaHectares,
      hasPolygon: plot.hasPolygon(),
      boundary: Object.freeze(
        plot.boundary.map((point) =>
          Object.freeze({ latitude: point.latitude, longitude: point.longitude }),
        ),
      ),
    });
  }

  selectPlot = (plotId: number): void => {
    if (this.findPlot(plotId)) this.selectedPlotIdSignal.set(plotId);
  };

  refreshPlot = (plotId: number): void => {
    const ownerId = this.currentUserId();
    if (ownerId === null || !this.findPlot(plotId)) return;
    const revision = this.plotRevision;
    this.farmingApi.getPlotById(plotId).subscribe({
      next: (plot) => {
        if (this.isPlotParticipant(ownerId, revision) && plot.ownerUserId === ownerId) {
          this.replacePlot(plot);
        }
      },
      error: (error) => {
        if (this.isPlotParticipant(ownerId, revision)) this.fail(error, 'farming.errors.load-plot');
      },
    });
  };

  // ---------- FieldPlot aggregate ----------

  /**
   * Registers a plot and starts its first campaign with the returned plot ID.
   * @remarks Rechecks the owner-scoped quota before POST and serializes local mutations.
   * The backend must enforce the quota atomically across browsers and clients.
   * @param command - Owner, name, region and declared area of the plot.
   * @param setup - Commands of the first campaign.
   * @param onRegistered - Called with the new plot, to continue with its polygon.
   */
  registerPlot = (
    command: RegisterFieldPlotCommand,
    setup: CropCampaignSetup,
    onRegistered?: (plot: FieldPlot) => void,
  ): void => {
    if (this.plotMutationBusy()) return;
    const ownerUserId = this.currentUserId();
    if (ownerUserId === null || command.ownerUserId !== ownerUserId) {
      this.errorSignal.set('farming.errors.plot-not-owned');
      return;
    }
    if (!this.canRegisterPlot()) {
      this.errorSignal.set(
        this.plotQuotaReached()
          ? 'farming.errors.quota-reached'
          : 'farming.errors.quota-unavailable',
      );
      return;
    }
    let plot: FieldPlot;
    try {
      plot = new FieldPlot({
        id: 0,
        ownerUserId: command.ownerUserId,
        name: command.name.trim(),
        region: command.region.trim(),
        areaHectares: command.declaredAreaHectares,
      });
    } catch (error) {
      this.fail(error, 'farming.errors.register-plot');
      return;
    }
    const revision = this.plotRevision;
    let created = false;
    let quotaChecked = false;
    let creationStarted = false;
    this.plotMutationBusy.set(true);
    this.startLoading();
    this.plotMutation = this.farmingApi
      .getPlotsByOwner(ownerUserId)
      .pipe(
        switchMap((records) => {
          if (!this.isPlotParticipant(ownerUserId, revision))
            return throwError(() => new Error('farming.errors.plot-not-owned'));
          const owned = this.ownedPlots(records, ownerUserId);
          this.plotsSignal.set(owned);
          quotaChecked = true;
          if (owned.length >= this.plotQuota())
            return throwError(() => new Error('farming.errors.quota-reached'));
          creationStarted = true;
          return this.farmingApi.createPlot(plot);
        }),
        tap((createdPlot) => {
          if (
            !this.isPlotParticipant(ownerUserId, revision) ||
            createdPlot.ownerUserId !== ownerUserId
          )
            throw new Error('farming.errors.plot-not-owned');
          created = true;
          // The slot is consumed as soon as the plot exists, even if its campaign later fails.
          this.plotsSignal.update((plots) => [
            ...plots.filter((item) => item.id !== createdPlot.id),
            createdPlot,
          ]);
          this.campaignsByPlotSignal.update((campaigns) =>
            new Map(campaigns).set(createdPlot.id as number, []),
          );
        }),
        switchMap((createdPlot) =>
          this.createCampaign(createdPlot.id as number, setup).pipe(
            map((campaign) => ({ createdPlot, campaign })),
          ),
        ),
      )
      .subscribe({
        next: ({ createdPlot, campaign }) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.campaignsByPlotSignal.update((campaigns) =>
            new Map(campaigns).set(createdPlot.id as number, [campaign]),
          );
          this.plotMutationBusy.set(false);
          this.loadingSignal.set(false);
          this.selectPlot(createdPlot.id as number);
          onRegistered?.(createdPlot);
        },
        error: (error) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.plotMutationBusy.set(false);
          this.registrationIncompleteSignal.set(created);
          // A lost POST response leaves an unknown count: refresh before attempting another write.
          if (!quotaChecked || (creationStarted && !created)) this.quotaLoaded.set(false);
          const key = created
            ? 'farming.errors.registration-partial'
            : error instanceof Error && error.message.startsWith('farming.errors.')
              ? error.message
              : creationStarted
                ? 'farming.errors.registration-unconfirmed'
                : 'farming.errors.quota-check';
          this.fail(error, key);
        },
      });
  };

  /**
   * Saves the GPS polygon of a plot and its area (US-29), and links it to
   * AgroMonitoring so the satellite monitoring starts (policy P3, US-30).
   * @param command - Plot and vertices of the polygon.
   * @param onDelineated - Called with the saved plot.
   */
  delineateBoundary = (
    command: DelineatePlotBoundaryCommand,
    onDelineated?: (plot: FieldPlot) => void,
  ): void => {
    if (!this.findPlot(command.plotId) || this.loading()) return;
    this.startLoading();
    this.farmingApi
      .savePolygon(command.plotId, command.coordinates)
      .subscribe({
        next: (updated) => {
          this.replacePlot(updated);
          this.loadingSignal.set(false);
          onDelineated?.(updated);
        },
        error: (error) => this.fail(error, 'farming.errors.save-polygon'),
      });
  };

  /**
   * Records the initial soil analysis of a plot.
   * @param command - pH, texture, organic matter and date of the analysis.
   * @param onRecorded - Called after the API confirms.
   */
  recordSoilBaseline = (command: RecordSoilBaselineCommand, onRecorded?: () => void): void => {
    if (!this.findPlot(command.plotId) || this.loading()) return;
    let soil: SoilBaseline;
    try {
      soil = new SoilBaseline({
        ph: command.ph,
        texture: command.texture,
        organicMatterPercentage: command.organicMatterPercentage,
        recordedAt: command.recordedAt,
      });
    } catch (error) {
      this.fail(error, 'farming.errors.save-soil');
      return;
    }
    this.startLoading();
    this.farmingApi.saveSoilBaseline(command.plotId, soil).subscribe({
      next: (plot) => {
        this.replacePlot(plot);
        this.loadingSignal.set(false);
        onRecorded?.();
      },
      error: (error) => this.fail(error, 'farming.errors.save-soil'),
    });
  };

  // ---------- CropCampaign aggregate ----------

  /**
   * Starts a new campaign on a plot whose previous campaign is closed.
   * @param setup - Commands of the new campaign.
   * @param onStarted - Called with the new campaign.
   */
  startCampaign = (
    setup: CropCampaignSetup,
    onStarted?: (campaign: CropCampaign) => void,
  ): void => {
    const plotId = setup.start.plotId;
    if (!this.findPlot(plotId) || this.loading()) return;
    this.startLoading();
    this.createCampaign(plotId, setup).subscribe({
      next: (campaign) => {
        this.campaignsByPlotSignal.update((campaigns) =>
          new Map(campaigns).set(plotId, [...(campaigns.get(plotId) ?? []), campaign]),
        );
        // P8: the platform opened the cost ledger of the new campaign.
        this.loadLedgerOf(campaign.id as number);
        this.loadingSignal.set(false);
        onStarted?.(campaign);
      },
      error: (error) => this.fail(error, 'farming.errors.start-campaign'),
    });
  };

  updateCampaign = (
    campaignId: number,
    fields: Pick<CropCampaign, 'cropType' | 'seedVariety' | 'customSeedVariety' | 'sowingDate'>,
    onUpdated?: () => void,
  ): void => {
    const current = this.findCampaign(campaignId);
    if (!current?.isActive() || this.loading()) return;
    let edited: CropCampaign;
    try {
      edited = new CropCampaign({
        id: campaignId,
        plotId: current.plotId,
        season: current.season,
        status: current.status,
        ...fields,
      });
    } catch (error) {
      this.fail(error, 'farming.errors.update-campaign');
      return;
    }
    this.startLoading();
    this.farmingApi.updateCampaign(edited).subscribe({
      next: (campaign) => {
        this.replaceCampaign(campaign);
        this.loadingSignal.set(false);
        onUpdated?.();
      },
      error: (error) => this.fail(error, 'farming.errors.update-campaign'),
    });
  };

  closeCampaign = (command: CloseCropCampaignCommand): void => {
    const current = this.findCampaign(command.campaignId);
    if (!current?.isActive() || this.loading()) return;
    this.startLoading();
    this.farmingApi.closeCampaign(command.campaignId).subscribe({
      next: (campaign) => {
        this.replaceCampaign(campaign);
        // The platform froze the cost ledger of the closed campaign.
        this.loadLedgerOf(campaign.id as number);
        this.loadingSignal.set(false);
      },
      error: (error) => this.fail(error, 'farming.errors.close-campaign'),
    });
  };

  // ---------- CampaignLedger aggregate ----------

  /**
   * Adds an expense to the ledger of the active campaign (US-37 to US-39).
   *
   * @remarks
   * Without connection the expense is kept on the device and shown at once;
   * it is sent when the connection comes back. The platform records an
   * expense only once per `clientSyncId`, so sending it again is safe.
   */
  recordExpense = (command: RecordExpenseCommand, onRecorded?: () => void): void => {
    if (!this.offlineSync.isOnline()) {
      this.recordOffline(command, onRecorded);
      return;
    }
    this.startLoading();
    this.sendExpense(command).subscribe({
      next: (ledger) => {
        this.setLedger(ledger.campaignId, ledger);
        this.loadingSignal.set(false);
        onRecorded?.();
      },
      error: (error) => {
        if (!this.offlineSync.isOnline()) {
          this.loadingSignal.set(false);
          this.recordOffline(command, onRecorded);
          return;
        }
        this.fail(error, 'farming.errors.record-expense');
      },
    });
  };

  /** Changes the expected yield, which updates the breakeven price (US-40). */
  setExpectedYield = (command: SetExpectedYieldCommand): void => {
    const ledger = this.findLedger(command.ledgerId);
    if (!ledger) return;
    this.estimateYield(ledger, command.expectedYield, ledger.actualYield, 'farming.errors.save-yield');
  };

  /**
   * Records the harvested yield (policy P10); the breakeven price then uses it.
   * @param command - Ledger, yield and unit.
   * @param onRecorded - Called after the API confirms.
   */
  recordActualYield = (command: RecordActualYieldCommand, onRecorded?: () => void): void => {
    const ledger = this.findLedger(command.ledgerId);
    if (!ledger) return;
    this.estimateYield(
      ledger,
      ledger.expectedYield,
      command.actualYield,
      'farming.errors.save-actual-yield',
      onRecorded,
    );
  };

  /**
   * Downloads the cost report of a campaign as a PDF (US-40).
   * @param command - Campaign of the report.
   */
  exportCostReport = (command: ExportCampaignCostReportCommand): void => {
    const campaign = this.findCampaign(command.campaignId);
    const ledger = this.ledgersByCampaignSignal().get(command.campaignId);
    if (!campaign || !ledger) return;
    const plot = this.findPlot(campaign.plotId);
    this.fileDownloader.save({
      fileName: `cost-report-${campaign.season}.pdf`,
      content: this.costReportPdf.build(ledger, campaign.season, plot?.name ?? '', plot?.areaHectares ?? 0),
    });
  };

  /**
   * Sends the expenses recorded offline to the API, one after the other.
   * The platform ignores the expenses that were already recorded.
   */
  syncPendingExpenses = (): void => {
    if (this.syncingSignal() || !this.offlineSync.isOnline()) return;
    const commands = this.offlineSync
      .pendingOf<PendingExpensePayload>(PendingOperationType.FIELD_EXPENSE)
      .map(this.pendingExpenses.toCommand);
    if (commands.length === 0) return;
    this.syncingSignal.set(true);
    from(commands)
      .pipe(
        concatMap((command) =>
          this.sendExpense(command).pipe(
            map((ledger) => ({ ledger, command })),
            // An expense that fails (for example, its campaign was closed) does not stop the others.
            catchError((error) => {
              console.error(error);
              return of(null);
            }),
          ),
        ),
      )
      .subscribe({
        next: (result) => {
          if (!result) return;
          this.offlineSync.remove([result.command.clientSyncId]);
          this.setLedger(result.ledger.campaignId, result.ledger);
        },
        complete: () => this.syncingSignal.set(false),
      });
  };

  // ---------- Campaign setup ----------

  /** Unit of the yield of a crop: sacks for potato and quintals for coffee. */
  yieldUnitOf = (cropType: CropType): YieldUnit =>
    cropType === CropType.SPECIALTY_COFFEE ? YieldUnit.QUINTAL : YieldUnit.SACK;

  /** Agricultural season of a date: `YYYY-I` from January to June, `YYYY-II` from July. */
  seasonOf = (date: Date): string => `${date.getFullYear()}-${date.getMonth() < 6 ? 'I' : 'II'}`;

  // ---------- Helpers ----------

  private createCampaign(plotId: number, setup: CropCampaignSetup): Observable<CropCampaign> {
    try {
      const campaign = new CropCampaign({
        id: 0,
        plotId,
        season: setup.start.season.trim(),
        cropType: setup.cropType.cropType,
        seedVariety: setup.seedVariety.varietyName.trim(),
        customSeedVariety: setup.seedVariety.custom,
        sowingDate: setup.sowingDate.sowingDate,
      });
      return this.farmingApi.createCampaign(campaign);
    } catch (error) {
      return throwError(() => error);
    }
  }

  /**
   * Loads the cost ledger of a campaign into the state.
   * @param campaignId - Campaign of the ledger.
   */
  private loadLedgerOf(campaignId: number): void {
    this.farmingApi.getLedgerByCampaign(campaignId).subscribe({
      next: (ledger) => this.setLedger(campaignId, ledger),
      error: (error) => this.fail(error, 'farming.errors.load-ledger'),
    });
  }

  /**
   * Sends one expense command to the endpoint of its category.
   * @param command - Input, labor or freight expense.
   * @returns Stream with the recalculated ledger.
   */
  private sendExpense(command: RecordExpenseCommand): Observable<CampaignLedger> {
    if (command instanceof RecordInputExpenseCommand)
      return this.farmingApi.recordInputExpense(command);
    if (command instanceof RecordDailyLaborExpenseCommand)
      return this.farmingApi.recordDailyLaborExpense(command);
    return this.farmingApi.recordFieldFreightExpense(command);
  }

  /**
   * Saves both yields of a ledger; the platform replaces them together (US-40).
   * @param ledger - Ledger of the campaign.
   * @param expectedYield - Yield the producer expects.
   * @param actualYield - Yield harvested, or `null` before the harvest.
   * @param errorKey - i18n key shown when it fails.
   * @param onSaved - Called after the API confirms.
   */
  private estimateYield(
    ledger: CampaignLedger,
    expectedYield: number,
    actualYield: number | null,
    errorKey: string,
    onSaved?: () => void,
  ): void {
    this.startLoading();
    this.farmingApi
      .estimateCampaignYield(ledger.id as number, expectedYield, actualYield)
      .subscribe({
        next: (saved) => {
          this.setLedger(saved.campaignId, saved);
          this.loadingSignal.set(false);
          onSaved?.();
        },
        error: (error) => this.fail(error, errorKey),
      });
  }

  /** Keeps the expense on the device and shows it in the ledger until it is synchronized. */
  private recordOffline(command: RecordExpenseCommand, onRecorded?: () => void): void {
    const current = this.findLedger(command.ledgerId);
    if (!current) return;
    const ledger = this.copyLedger(current);
    try {
      this.applyExpense(ledger, command);
    } catch (error) {
      this.fail(error, 'farming.errors.record-expense');
      return;
    }
    this.offlineSync.enqueue(this.pendingExpenses.toOperation(command));
    this.setLedger(ledger.campaignId, ledger);
    this.errorSignal.set(null);
    onRecorded?.();
  }

  private findPlot(plotId: number): FieldPlot | undefined {
    return this.plots().find((plot) => plot.id === plotId);
  }

  private findCampaign(campaignId: number): CropCampaign | undefined {
    for (const campaigns of this.campaignsByPlotSignal().values()) {
      const campaign = campaigns.find((item) => item.id === campaignId);
      if (campaign) return campaign;
    }
    return undefined;
  }

  private findLedger(ledgerId: number): CampaignLedger | undefined {
    for (const ledger of this.ledgersByCampaignSignal().values()) {
      if (ledger?.id === ledgerId) return ledger;
    }
    return undefined;
  }

  private replacePlot(plot: FieldPlot): void {
    this.plotsSignal.update((plots) => plots.map((item) => (item.id === plot.id ? plot : item)));
  }

  private replaceCampaign(campaign: CropCampaign): void {
    this.campaignsByPlotSignal.update((current) => {
      const campaigns = (current.get(campaign.plotId) ?? []).map((item) =>
        item.id === campaign.id ? campaign : item,
      );
      return new Map(current).set(campaign.plotId, campaigns);
    });
  }

  private setLedger(campaignId: number, ledger: CampaignLedger | null): void {
    this.ledgersByCampaignSignal.update((ledgers) => new Map(ledgers).set(campaignId, ledger));
  }

  /** A plot without polygon has no satellite observations yet. */
  /** Forgets the plots of the previous user (after signing out). */
  private clearState(): void {
    this.plotRevision++;
    this.plotMutation?.unsubscribe();
    this.plotMutationBusy.set(false);
    this.quotaLoaded.set(false);
    this.quotaOwner.set(null);
    this.planPlotQuota.set(null);
    this.registrationIncompleteSignal.set(false);
    this.plotsLoadingSignal.set(false);
    this.plotsLoad?.unsubscribe();
    this.loadingSignal.set(false);
    this.plotsSignal.set([]);
    this.campaignsByPlotSignal.set(new Map());
    this.ledgersByCampaignSignal.set(new Map());
    this.selectedPlotIdSignal.set(null);
    this.errorSignal.set(null);
  }

  /** Keeps quota counts account-scoped even if a demo endpoint returns unrelated rows. */
  private ownedPlots(plots: FieldPlot[], ownerUserId: number): FieldPlot[] {
    return [
      ...new Map(
        plots.filter((plot) => plot.ownerUserId === ownerUserId).map((plot) => [plot.id, plot]),
      ).values(),
    ];
  }

  /** Rejects delayed responses from a previous account or an obsolete quota snapshot. */
  private isPlotParticipant(ownerUserId: number, revision: number): boolean {
    return this.currentUserId() === ownerUserId && this.plotRevision === revision;
  }

  private startLoading(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
  }

  /**
   * Normalizes an error into an i18n key to show it in the view.
   * @param error - Source error.
   * @param fallbackKey - i18n key of the failed operation.
   */
  private fail(error: unknown, fallbackKey: string): void {
    const detail =
      error instanceof HttpErrorResponse && [400, 403, 409, 422].includes(error.status)
        ? error.error?.details || error.error?.detail
        : null;
    this.errorSignal.set(typeof detail === 'string' && detail.trim() ? detail : fallbackKey);
    this.loadingSignal.set(false);
  }

  /**
   * Adds an expense command to a ledger: inputs (quantity × unit price),
   * labor (workers × days at the daily wage) or freight (one trip).
   * An expense already recorded with the same device code is ignored.
   */
  private applyExpense(ledger: CampaignLedger, command: RecordExpenseCommand): void {
    if (command instanceof RecordInputExpenseCommand)
      this.addExpense(
        ledger,
        ExpenseCategory.INPUTS,
        command.inputName,
        command.quantity,
        command.unitPrice,
        command,
      );
    else if (command instanceof RecordDailyLaborExpenseCommand)
      this.addExpense(
        ledger,
        ExpenseCategory.LABOR,
        command.activity,
        command.workers * command.days,
        command.dailyWage,
        command,
      );
    else this.addExpense(ledger, ExpenseCategory.FREIGHT, command.route, 1, command.cost, command);
  }

  private addExpense(
    ledger: CampaignLedger,
    category: ExpenseCategory,
    description: string,
    quantity: number,
    unitPrice: number,
    command: RecordExpenseCommand,
  ): void {
    if (ledger.entries.some((entry) => entry.clientSyncId === command.clientSyncId)) return;
    const nextId = Math.max(0, ...ledger.entries.map((entry) => entry.id as number)) + 1;
    ledger.entries = [
      ...ledger.entries,
      new ExpenseEntry({
        id: nextId,
        ledgerId: ledger.id as number,
        category,
        description: description.trim(),
        quantity,
        unitPrice: new Money(unitPrice, ledger.currency),
        expenseDate: command.expenseDate,
        clientSyncId: command.clientSyncId,
      }),
    ];
  }

  private copyLedger(ledger: CampaignLedger): CampaignLedger {
    return new CampaignLedger({
      id: ledger.id as number,
      campaignId: ledger.campaignId,
      entries: [...ledger.entries],
      expectedYield: ledger.expectedYield,
      actualYield: ledger.actualYield,
      yieldUnit: ledger.yieldUnit,
      frozen: ledger.frozen,
      currency: ledger.currency,
    });
  }

  /** Campaign in progress, or the most recent one. */
  private static currentOf(campaigns: CropCampaign[]): CropCampaign | undefined {
    return (
      campaigns.find((campaign) => campaign.status === CampaignStatus.IN_PROGRESS) ??
      campaigns.at(-1)
    );
  }
}
