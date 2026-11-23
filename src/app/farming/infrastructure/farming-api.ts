import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { RecordDailyLaborExpenseCommand } from '../domain/model/commands/record-daily-labor-expense.command';
import { RecordFieldFreightExpenseCommand } from '../domain/model/commands/record-field-freight-expense.command';
import { RecordInputExpenseCommand } from '../domain/model/commands/record-input-expense.command';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { FieldPlot, GeoCoordinate, SoilBaseline } from '../domain/model/entities/field-plot.entity';
import { CampaignLedgersApiEndpoint } from './endpoints/campaign-ledgers-api-endpoint';
import { CropCampaignsApiEndpoint } from './endpoints/crop-campaigns-api-endpoint';
import { FieldPlotsApiEndpoint } from './endpoints/field-plots-api-endpoint';

/**
 * Infrastructure facade for field plot, crop campaign and cost ledger endpoint operations.
 */
@Injectable({ providedIn: 'root' })
export class FarmingApi extends BaseApi {
  private readonly plotRevision = signal(0);
  /** Notifies readers after a confirmed plot mutation; does not duplicate plot state. */
  readonly plotChanges = this.plotRevision.asReadonly();
  private readonly http = inject(HttpClient);
  private readonly plotsEndpoint = new FieldPlotsApiEndpoint(this.http);
  private readonly campaignsEndpoint = new CropCampaignsApiEndpoint(this.http);
  private readonly ledgersEndpoint = new CampaignLedgersApiEndpoint(this.http);

  /**
   * Retrieves the plots of one producer.
   * @param ownerUserId - Producer who owns the plots.
   * @returns Stream with the plot collection.
   */
  getPlotsByOwner = (ownerUserId: number): Observable<FieldPlot[]> =>
    this.plotsEndpoint.getByOwner(ownerUserId);

  /**
   * Retrieves the plots with the given IDs; the ones that no longer exist are skipped.
   * @param ids - The IDs of the plots.
   * @returns Stream with the plot collection.
   */
  getPlotsByIds = (ids: number[]): Observable<FieldPlot[]> => this.plotsEndpoint.getByIds(ids);

  /**
   * Retrieves a single plot by ID.
   * @param id - The ID of the plot.
   * @returns An Observable of the FieldPlot object.
   */
  getPlotById = (id: number): Observable<FieldPlot> => this.plotsEndpoint.getById(id);

  /**
   * Creates a new plot.
   * @param plot - The plot to create.
   * @returns An Observable of the created FieldPlot object.
   */
  createPlot = (plot: FieldPlot): Observable<FieldPlot> =>
    this.plotsEndpoint
      .create(plot)
      .pipe(tap(() => this.plotRevision.update((revision) => revision + 1)));

  savePolygon = (id: number, coordinates: readonly GeoCoordinate[]): Observable<FieldPlot> =>
    this.plotsEndpoint
      .savePolygon(id, coordinates)
      .pipe(tap(() => this.plotRevision.update((revision) => revision + 1)));

  saveSoilBaseline = (id: number, soil: SoilBaseline): Observable<FieldPlot> =>
    this.plotsEndpoint
      .saveSoilBaseline(id, soil)
      .pipe(tap(() => this.plotRevision.update((revision) => revision + 1)));

  /**
   * Retrieves the campaigns of one plot.
   * @param plotId - Plot where the campaigns take place.
   * @returns Stream with the campaign collection.
   */
  getCampaignsByPlot = (plotId: number): Observable<CropCampaign[]> =>
    this.campaignsEndpoint.getByPlot(plotId);

  /**
   * Creates a new campaign.
   * @param campaign - The campaign to create.
   * @returns An Observable of the created CropCampaign object.
   */
  createCampaign = (campaign: CropCampaign): Observable<CropCampaign> =>
    this.campaignsEndpoint.create(campaign);

  /**
   * Updates an existing campaign.
   * @param campaign - The campaign to update.
   * @returns An Observable of the updated CropCampaign object.
   */
  updateCampaign = (campaign: CropCampaign): Observable<CropCampaign> =>
    this.campaignsEndpoint.update(campaign, campaign.id);

  closeCampaign = (id: number): Observable<CropCampaign> => this.campaignsEndpoint.close(id);

  /**
   * Retrieves the cost ledger of a campaign; the platform opens it when the campaign starts.
   * @param campaignId - Campaign of the ledger.
   * @returns Stream with the ledger, or `null` if the campaign has none.
   */
  getLedgerByCampaign = (campaignId: number): Observable<CampaignLedger | null> =>
    this.ledgersEndpoint.getByCampaign(campaignId);

  /**
   * Records an input expense (US-37).
   * @param command - Input bought.
   * @returns Stream with the recalculated ledger.
   */
  recordInputExpense = (command: RecordInputExpenseCommand): Observable<CampaignLedger> =>
    this.ledgersEndpoint.recordInputExpense(command);

  /**
   * Records a daily labor expense (US-38).
   * @param command - Wages of a field activity.
   * @returns Stream with the recalculated ledger.
   */
  recordDailyLaborExpense = (command: RecordDailyLaborExpenseCommand): Observable<CampaignLedger> =>
    this.ledgersEndpoint.recordDailyLaborExpense(command);

  /**
   * Records a field freight expense (US-39).
   * @param command - Cost of one freight.
   * @returns Stream with the recalculated ledger.
   */
  recordFieldFreightExpense = (
    command: RecordFieldFreightExpenseCommand,
  ): Observable<CampaignLedger> => this.ledgersEndpoint.recordFieldFreightExpense(command);

  /**
   * Records the expected and actual yield of a campaign (US-40).
   * @param ledgerId - Ledger of the campaign.
   * @param expectedYield - Yield the producer expects.
   * @param actualYield - Yield harvested, or `null` before the harvest.
   * @returns Stream with the recalculated ledger.
   */
  estimateCampaignYield = (
    ledgerId: number,
    expectedYield: number,
    actualYield: number | null,
  ): Observable<CampaignLedger> =>
    this.ledgersEndpoint.estimateYield(ledgerId, { expectedYield, actualYield });
}
