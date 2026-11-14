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
  toArray,
} from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { OfflineSync } from '../infrastructure/offline/offline-sync';
import { PendingOperationType } from '../infrastructure/offline/pending-operation';
import { CloseCropCampaignCommand } from '../domain/model/commands/close-crop-campaign.command';
import { DelineatePlotBoundaryCommand } from '../domain/model/commands/delineate-plot-boundary.command';
import { ExportCampaignCostReportCommand } from '../domain/model/commands/export-campaign-cost-report.command';
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
import { CampaignStatus, CropCampaign, CropType } from '../domain/model/entities/crop-campaign.entity';
import { ExpenseCategory, ExpenseEntry } from '../domain/model/entities/expense-entry.entity';
import { FieldPlot, SoilBaseline } from '../domain/model/entities/field-plot.entity';
import { FieldManagementApi } from '../infrastructure/field-management-api';
import {
  ExpenseCommand,
  PendingExpenseAssembler,
  PendingExpensePayload,
} from '../infrastructure/assemblers/pending-expense-assembler';
import { FileDownloader } from '../../shared/infrastructure/file-downloader';

/**
 * Plots included in the Seed plan (demo quota until subscriptions are implemented).
 *
 * @remarks
 * The quota belongs to Subscriptions and Payments; with the RESTful API,
 * Field Management asks for it before registering a plot.
 */
export const SEED_PLAN_PLOT_QUOTA = 4;

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
  expectedYield?: SetExpectedYieldCommand;
}

/**
 * Holds the Field Management state and coordinates its application behavior.
 *
 * @remarks
 * It keeps the producer's plots with their campaigns and cost ledgers, and the
 * selected plot. The views send commands and read signals. Every change is
 * applied to a copy of the aggregate; the shown state and the domain events
 * are only updated when the API confirms. It also applies the policies of the
 * context: P3 (link the polygon to AgroMonitoring), P8 (open the cost ledger
 * when a campaign starts) and keeps the expenses recorded offline.
 */
@Injectable({ providedIn: 'root' })
export class FieldManagementStore {
  private readonly fieldManagementApi = inject(FieldManagementApi);
  private readonly session = inject(IamStore);
  private readonly offlineSync = inject(OfflineSync);
  private readonly pendingExpenses = new PendingExpenseAssembler();
  private readonly fileDownloader = inject(FileDownloader);

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
  private ledgersLoad?: Subscription;

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
  readonly pendingExpenseCount = this.offlineSync.pendingCountOf(PendingOperationType.FIELD_EXPENSE);

  /** `true` while the offline expenses are being synchronized. */
  readonly syncing = this.syncingSignal.asReadonly();

  /** Authenticated producer who owns the plots. */
  readonly currentUserId = computed(() => {
    const user = this.session.activeUser();

    return user?.experience === 'FARMER' ? user.id : null;
  });

  /** Number of plots of the producer. */
  readonly plotCount = computed(() => this.plots().length);

  /** Plots allowed by the plan of the producer. */
  readonly plotQuota = signal(SEED_PLAN_PLOT_QUOTA).asReadonly();

  /** Quota is known only after a successful read for the currently selected producer. */
  readonly plotQuotaReady = computed(
    () =>
      this.currentUserId() !== null &&
      this.quotaOwner() === this.currentUserId() &&
      this.quotaLoaded() &&
      !this.plotsLoading(),
  );

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
  readonly activeCampaign = computed(() => FieldManagementStore.currentOf(this.campaigns()));

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
   * Creates an instance of FieldManagementStore. It loads the plots of the
   * producer every time the signed-in user changes, and synchronizes the
   * offline expenses every time the connection comes back.
   */
  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearState());
    effect(() => {
      const userId = this.currentUserId();
      untracked(() => (userId === null ? this.clearState() : this.loadMyPlots(userId)));
    });
    effect(() => {
      if (this.offlineSync.isOnline() && this.pendingExpenseCount() > 0) {
        untracked(() => this.syncPendingExpenses());
      }
    });
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
    computed(() => FieldManagementStore.currentOf(this.campaignsByPlotSignal().get(plotId) ?? []));

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
    this.ledgersLoad?.unsubscribe();
    this.plotsLoadingSignal.set(true);
    this.startLoading();
    this.plotsLoad = this.fieldManagementApi
      .getPlotsByOwner(ownerUserId)
      .pipe(
        retry(2),
        map((plots) => this.ownedPlots(plots, ownerUserId)),
        switchMap((plots) =>
          plots.length === 0
            ? of({ plots, campaigns: [] as CropCampaign[][] })
            : forkJoin(
                plots.map((plot) => this.fieldManagementApi.getCampaignsByPlot(plot.id as number)),
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
          this.fail(error, 'field-management.errors.load-plots');
        },
      });
  };

  /**
   * Shares the selected plot with Crop Health, which also shows the plots of
   * advisors and cooperatives that are not part of the producer's plots.
   * @param plotId - Plot to show, or `null`.
   */
  selectPlotId = (plotId: number | null): void => this.selectedPlotIdSignal.set(plotId);

  /**
   * Selects a plot and loads the cost ledgers of its campaigns.
   * @param plotId - Plot to show.
   */
  selectPlot = (plotId: number): void => {
    if (!this.plots().some((plot) => plot.id === plotId)) return;
    this.ledgersLoad?.unsubscribe();
    this.selectedPlotIdSignal.set(plotId);
    const campaigns = this.campaignsByPlotSignal().get(plotId) ?? [];
    if (campaigns.length === 0) return;
    this.startLoading();
    this.ledgersLoad = forkJoin(
      campaigns.map((campaign) =>
        this.fieldManagementApi.getLedgerByCampaign(campaign.id as number).pipe(retry(2)),
      ),
    ).subscribe({
      next: (ledgers) => {
        this.ledgersByCampaignSignal.update((current) => {
          const next = new Map(current);
          campaigns.forEach((campaign, index) => next.set(campaign.id as number, ledgers[index]));
          return next;
        });
        this.loadingSignal.set(false);
      },
      error: (error) => this.fail(error, 'field-management.errors.load-plot'),
    });
  };

  // ---------- FieldPlot aggregate ----------

  /**
   * Registers a plot "without polygon" with its first campaign and its cost ledger (US-28, US-32 to US-36).
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
      this.errorSignal.set('field-management.errors.plot-not-owned');
      return;
    }
    if (!this.canRegisterPlot()) {
      this.errorSignal.set(
        this.plotQuotaReached()
          ? 'field-management.errors.quota-reached'
          : 'field-management.errors.quota-unavailable',
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
      this.fail(error, 'field-management.errors.register-plot');
      return;
    }
    const revision = this.plotRevision;
    let created = false;
    let quotaChecked = false;
    let creationStarted = false;
    this.plotMutationBusy.set(true);
    this.startLoading();
    this.plotMutation = this.fieldManagementApi
      .getPlotsByOwner(ownerUserId)
      .pipe(
        switchMap((records) => {
          if (!this.isPlotParticipant(ownerUserId, revision))
            return throwError(() => new Error('field-management.errors.plot-not-owned'));
          const owned = this.ownedPlots(records, ownerUserId);
          this.plotsSignal.set(owned);
          quotaChecked = true;
          if (owned.length >= this.plotQuota())
            return throwError(() => new Error('field-management.errors.quota-reached'));
          creationStarted = true;
          return this.fieldManagementApi.createPlot(plot);
        }),
        tap((createdPlot) => {
          if (
            !this.isPlotParticipant(ownerUserId, revision) ||
            createdPlot.ownerUserId !== ownerUserId
          )
            throw new Error('field-management.errors.plot-not-owned');
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
          this.createCampaignWithLedger(createdPlot.id as number, setup, []).pipe(
            map((result) => ({ createdPlot, ...result })),
          ),
        ),
      )
      .subscribe({
        next: ({ createdPlot, campaign, ledger }) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.campaignsByPlotSignal.update((campaigns) =>
            new Map(campaigns).set(createdPlot.id as number, [campaign]),
          );
          this.setLedger(campaign.id as number, ledger);
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
            ? 'field-management.errors.registration-partial'
            : error instanceof Error && error.message.startsWith('field-management.errors.')
              ? error.message
              : creationStarted
                ? 'field-management.errors.registration-unconfirmed'
                : 'field-management.errors.quota-check';
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
    const current = this.findPlot(command.plotId);
    if (!current) return;
    const plot = this.copyPlot(current);
    try {
      plot.boundary = [...command.coordinates];
      plot.areaHectares = command.areaHectares;
    } catch (error) {
      this.fail(error, 'field-management.errors.invalid-polygon');
      return;
    }
    this.startLoading();
    this.fieldManagementApi
      .updatePlot(plot)
      .pipe(retry(2))
      .subscribe({
        next: (updated) => {
          this.replacePlot(updated);
          this.loadingSignal.set(false);
          onDelineated?.(updated);
        },
        error: (error) => this.fail(error, 'field-management.errors.save-polygon'),
      });
  };

  /**
   * Records the initial soil analysis of a plot.
   * @param command - pH, texture, organic matter and date of the analysis.
   * @param onRecorded - Called after the API confirms.
   */
  recordSoilBaseline = (command: RecordSoilBaselineCommand, onRecorded?: () => void): void => {
    this.savePlot(
      command.plotId,
      (plot) => {
        plot.soilBaseline = new SoilBaseline({
          ph: command.ph,
          texture: command.texture,
          organicMatterPercentage: command.organicMatterPercentage,
          recordedAt: command.recordedAt,
        });
      },
      'field-management.errors.save-soil',
      onRecorded,
    );
  };

  /**
   * Deletes a plot by ID.
   * @param id - The ID of the plot to delete.
   */
  deletePlot = (id: number): void => {
    if (this.plotMutationBusy() || this.loading()) return;
    const ownerUserId = this.currentUserId();
    const plot = this.findPlot(id);
    if (
      ownerUserId === null ||
      !this.plotQuotaReady() ||
      !plot ||
      plot.ownerUserId !== ownerUserId
    ) {
      this.errorSignal.set('field-management.errors.plot-not-owned');
      return;
    }
    const revision = this.plotRevision;
    this.plotMutationBusy.set(true);
    this.startLoading();
    this.plotMutation = this.fieldManagementApi
      .getPlotById(id)
      .pipe(
        switchMap((current) => {
          if (
            !this.isPlotParticipant(ownerUserId, revision) ||
            current.id !== id ||
            current.ownerUserId !== ownerUserId
          )
            return throwError(() => new Error('field-management.errors.plot-not-owned'));
          return this.deletePlotWithCampaigns(id);
        }),
      )
      .subscribe({
        next: () => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.plotsSignal.update((plots) => plots.filter((plot) => plot.id !== id));
          this.campaignsByPlotSignal.update((campaigns) => {
            const next = new Map(campaigns);
            next.delete(id);
            return next;
          });
          this.plotMutationBusy.set(false);
          this.loadingSignal.set(false);
          if (this.selectedPlotId() === id) {
            this.selectedPlotIdSignal.set(null);
            const first = this.plots()[0];
            if (first) this.selectPlot(first.id as number);
          }
        },
        error: (error) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.plotMutationBusy.set(false);
          // Failed or ambiguous deletion never frees a local slot without confirmation.
          this.fail(
            error,
            error instanceof Error && error.message === 'field-management.errors.plot-not-owned'
              ? error.message
              : 'field-management.errors.delete-plot',
          );
        },
      });
  };

  // ---------- CropCampaign aggregate ----------

  /**
   * Starts a new campaign on a plot whose previous campaign is closed, and
   * opens its cost ledger (policy P8).
   * @param setup - Commands of the new campaign.
   * @param onStarted - Called with the new campaign.
   */
  startCampaign = (
    setup: CropCampaignSetup,
    onStarted?: (campaign: CropCampaign) => void,
  ): void => {
    const plotId = setup.start.plotId;
    if (!this.findPlot(plotId)) return;
    this.startLoading();
    this.createCampaignWithLedger(
      plotId,
      setup,
      this.campaignsByPlotSignal().get(plotId) ?? [],
    ).subscribe({
      next: ({ campaign, ledger }) => {
        this.campaignsByPlotSignal.update((campaigns) =>
          new Map(campaigns).set(plotId, [...(campaigns.get(plotId) ?? []), campaign]),
        );
        this.setLedger(campaign.id as number, ledger);
        this.loadingSignal.set(false);
        onStarted?.(campaign);
      },
      error: (error) => this.fail(error, 'field-management.errors.start-campaign'),
    });
  };

  /**
   * Closes a campaign and freezes its cost ledger. When the producer knows
   * the harvest, it also records the actual yield.
   * @param command - Campaign to close.
   * @param actualYield - Harvested yield, if known.
   * @param onClosed - Called after the API confirms.
   */
  closeCampaign = (
    command: CloseCropCampaignCommand,
    actualYield?: RecordActualYieldCommand,
    onClosed?: () => void,
  ): void => {
    const current = this.findCampaign(command.campaignId);
    if (!current) return;
    const campaign = this.copyCampaign(current);
    const currentLedger = this.ledgersByCampaignSignal().get(command.campaignId) ?? null;
    const ledger = currentLedger ? this.copyLedger(currentLedger) : null;
    try {
      campaign.status = CampaignStatus.FINISHED;
      if (ledger && actualYield) ledger.actualYield = actualYield.actualYield;
      if (ledger) ledger.frozen = true;
    } catch (error) {
      this.fail(error, 'field-management.errors.close-campaign');
      return;
    }
    this.startLoading();
    this.fieldManagementApi
      .updateCampaign(campaign)
      .pipe(
        retry(2),
        switchMap((savedCampaign) => {
          const saveLedger: Observable<CampaignLedger | null> = ledger
            ? this.fieldManagementApi.updateLedger(ledger).pipe(retry(2))
            : of(null);
          return saveLedger.pipe(map((savedLedger) => ({ savedCampaign, savedLedger })));
        }),
      )
      .subscribe({
        next: ({ savedCampaign, savedLedger }) => {
          this.replaceCampaign(savedCampaign);
          if (savedLedger) this.setLedger(savedCampaign.id as number, savedLedger);
          this.loadingSignal.set(false);
          onClosed?.();
        },
        error: (error) => this.fail(error, 'field-management.errors.close-campaign'),
      });
  };

  // ---------- CampaignLedger aggregate ----------

  /**
   * Adds an expense to the ledger of the active campaign (US-37 to US-39).
   *
   * @remarks
   * Without connection the expense is kept on the device and shown at once;
   * it is synchronized when the connection comes back.
   */
  recordExpense = (command: RecordExpenseCommand, onRecorded?: () => void): void => {
    if (!this.offlineSync.isOnline()) {
      this.recordOffline(command, onRecorded);
      return;
    }
    this.saveLedger(
      command.ledgerId,
      (ledger) => this.applyExpense(ledger, command),
      'field-management.errors.record-expense',
      onRecorded,
      () => this.recordOffline(command, onRecorded),
    );
  };

  /** Changes the expected yield, which updates the breakeven price (US-40). */
  setExpectedYield = (command: SetExpectedYieldCommand): void => {
    this.saveLedger(
      command.ledgerId,
      (ledger) => {
        ledger.expectedYield = command.expectedYield;
        ledger.yieldUnit = command.unit;
      },
      'field-management.errors.save-yield',
    );
  };

  /**
   * Records the harvested yield (policy P10); the breakeven price then uses it.
   * @param command - Ledger, yield and unit.
   * @param onRecorded - Called after the API confirms.
   */
  recordActualYield = (command: RecordActualYieldCommand, onRecorded?: () => void): void => {
    this.saveLedger(
      command.ledgerId,
      (ledger) => {
        ledger.actualYield = command.actualYield;
      },
      'field-management.errors.save-actual-yield',
      onRecorded,
    );
  };

  /**
   * Builds the cost report of a campaign and downloads it.
   * @param command - Campaign of the report.
   */
  exportCostReport = (command: ExportCampaignCostReportCommand): void => {
    const campaign = this.findCampaign(command.campaignId);
    if (!campaign) {
      this.errorSignal.set('field-management.errors.export-report');
      return;
    }
    this.fieldManagementApi.downloadCostReport(command.campaignId).subscribe({
      next: (content) =>
        this.fileDownloader.save({ fileName: `cost-report-${campaign.season}.pdf`, content }),
      error: (error) => this.fail(error, 'field-management.errors.export-report'),
    });
  };

  /**
   * Sends the expenses recorded offline to the API, ledger by ledger.
   * The ledger ignores the expenses that were already saved.
   */
  syncPendingExpenses = (): void => {
    if (this.syncingSignal() || !this.offlineSync.isOnline()) return;
    const pending = this.offlineSync.pendingOf<PendingExpensePayload>(PendingOperationType.FIELD_EXPENSE);
    const ledgerIds = [...new Set(pending.map((operation) => operation.payload.ledgerId))];
    if (ledgerIds.length === 0) return;
    this.syncingSignal.set(true);
    from(ledgerIds)
      .pipe(
        concatMap((ledgerId) => {
          const commands = pending
            .filter((operation) => operation.payload.ledgerId === ledgerId)
            .map(this.pendingExpenses.toCommand);
          return this.fieldManagementApi.getLedgerById(ledgerId).pipe(
            switchMap((saved) => {
              const ledger = this.copyLedger(saved);
              commands.forEach((command) => this.applyExpense(ledger, command));
              return this.fieldManagementApi
                .updateLedger(ledger)
                .pipe(map((updated) => ({ updated, commands })));
            }),
            // A ledger that fails (for example, it was deleted) does not stop the others.
            catchError((error) => {
              console.error(error);
              return of(null);
            }),
          );
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) return;
          this.offlineSync.remove(result.commands.map((command) => command.clientSyncId));
          this.setLedger(result.updated.campaignId, result.updated);
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

  /**
   * Deletes a plot with its campaigns and cost ledgers, one request at a time.
   *
   * @remarks
   * The RESTful API deletes them in cascade; the fake API does not, so the
   * store does it to avoid orphan campaigns. json-server rewrites its file on
   * every change, so the requests go one after the other.
   */
  private deletePlotWithCampaigns(plotId: number): Observable<void> {
    return this.fieldManagementApi.getCampaignsByPlot(plotId).pipe(
      switchMap((campaigns) => from(campaigns)),
      concatMap((campaign) =>
        this.fieldManagementApi.getLedgerByCampaign(campaign.id as number).pipe(
          switchMap((ledger) =>
            ledger ? this.fieldManagementApi.deleteLedger(ledger.id as number) : of(undefined),
          ),
          switchMap(() => this.fieldManagementApi.deleteCampaign(campaign.id as number)),
        ),
      ),
      toArray(),
      switchMap(() => this.fieldManagementApi.deletePlot(plotId)),
    );
  }

  /**
   * Starts a campaign, applies its setup commands and opens its ledger (policy P8).
   *
   * @remarks
   * With the RESTful API the backend opens the ledger when it receives
   * `CropCampaignStarted`; with the fake API the store creates it.
   */
  private createCampaignWithLedger(
    plotId: number,
    setup: CropCampaignSetup,
    plotCampaigns: CropCampaign[],
  ): Observable<{
    campaign: CropCampaign;
    ledger: CampaignLedger;
  }> {
    let campaign: CropCampaign;
    try {
      campaign = new CropCampaign({
        id: 0,
        plotId,
        season: setup.start.season.trim(),
        cropType: setup.cropType.cropType,
        seedVariety: setup.seedVariety.varietyName.trim(),
        customSeedVariety: setup.seedVariety.custom,
        sowingDate: setup.sowingDate.sowingDate,
      });
    } catch (error) {
      return throwError(() => error);
    }
    return this.fieldManagementApi.createCampaign(campaign).pipe(
      switchMap((created) => {
        // Policy P8: Whenever CropCampaignStarted Then OpenCampaignLedger.
        const ledger = new CampaignLedger({
          id: 0,
          campaignId: created.id as number,
          yieldUnit: this.yieldUnitOf(created.cropType),
        });
        try {
          if (setup.expectedYield) {
            ledger.expectedYield = setup.expectedYield.expectedYield;
          }
        } catch (error) {
          return throwError(() => error);
        }
        return this.fieldManagementApi.createLedger(ledger).pipe(
          map((createdLedger) => ({ campaign: created, ledger: createdLedger })),
        );
      }),
    );
  }

  /**
   * Applies a change to a copy of a plot and saves it; the shown plot only
   * changes when the API confirms.
   */
  private savePlot(
    plotId: number,
    change: (plot: FieldPlot) => void,
    errorKey: string,
    onSaved?: () => void,
  ): void {
    const current = this.findPlot(plotId);
    if (!current) return;
    const plot = this.copyPlot(current);
    try {
      change(plot);
    } catch (error) {
      this.fail(error, errorKey);
      return;
    }
    this.startLoading();
    this.fieldManagementApi
      .updatePlot(plot)
      .pipe(retry(2))
      .subscribe({
        next: (saved) => {
          this.replacePlot(saved);
          this.loadingSignal.set(false);
          onSaved?.();
        },
        error: (error) => this.fail(error, errorKey),
      });
  }

  /**
   * Applies a change to a copy of a ledger and saves it; the shown ledger
   * only changes when the API confirms.
   * @param onOffline - Called instead of failing when the connection was lost.
   */
  private saveLedger(
    ledgerId: number,
    change: (ledger: CampaignLedger) => void,
    errorKey: string,
    onSaved?: () => void,
    onOffline?: () => void,
  ): void {
    const current = this.findLedger(ledgerId);
    if (!current) return;
    const ledger = this.copyLedger(current);
    try {
      change(ledger);
    } catch (error) {
      this.fail(error, errorKey);
      return;
    }
    this.startLoading();
    this.fieldManagementApi
      .updateLedger(ledger)
      .pipe(retry(2))
      .subscribe({
        next: (saved) => {
          this.setLedger(saved.campaignId, saved);
          this.loadingSignal.set(false);
          onSaved?.();
        },
        error: (error) => {
          if (onOffline && !this.offlineSync.isOnline()) {
            this.loadingSignal.set(false);
            onOffline();
            return;
          }
          this.fail(error, errorKey);
        },
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
      this.fail(error, 'field-management.errors.record-expense');
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
    this.registrationIncompleteSignal.set(false);
    this.plotsLoadingSignal.set(false);
    this.plotsLoad?.unsubscribe();
    this.ledgersLoad?.unsubscribe();
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
    console.error(error);
    this.errorSignal.set(fallbackKey);
    this.loadingSignal.set(false);
  }

  /**
   * Adds an expense command to a ledger: inputs (quantity × unit price),
   * labor (workers × days at the daily wage) or freight (one trip).
   * An expense already recorded with the same device code is ignored.
   */
  private applyExpense(ledger: CampaignLedger, command: RecordExpenseCommand): void {
    if (command instanceof RecordInputExpenseCommand)
      this.addExpense(ledger, ExpenseCategory.INPUTS, command.inputName, command.quantity, command.unitPrice, command);
    else if (command instanceof RecordDailyLaborExpenseCommand)
      this.addExpense(ledger, ExpenseCategory.LABOR, command.activity, command.workers * command.days, command.dailyWage, command);
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

  /** Copies of the entities, changed before the API confirms. */
  private copyPlot(plot: FieldPlot): FieldPlot {
    return new FieldPlot({
      id: plot.id as number,
      ownerUserId: plot.ownerUserId,
      name: plot.name,
      region: plot.region,
      status: plot.status,
      boundary: [...plot.boundary],
      areaHectares: plot.areaHectares,
      agroMonitoringPolygonId: plot.agroMonitoringPolygonId,
      soilBaseline: plot.soilBaseline,
    });
  }

  private copyCampaign(campaign: CropCampaign): CropCampaign {
    return new CropCampaign({
      id: campaign.id as number,
      plotId: campaign.plotId,
      season: campaign.season,
      cropType: campaign.cropType,
      seedVariety: campaign.seedVariety,
      customSeedVariety: campaign.customSeedVariety,
      sowingDate: campaign.sowingDate,
      status: campaign.status,
    });
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
    return campaigns.find((campaign) => campaign.status === CampaignStatus.IN_PROGRESS) ?? campaigns.at(-1);
  }
}
