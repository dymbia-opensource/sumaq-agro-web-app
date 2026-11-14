import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../domain/model/entities/field-plot.entity';
import { CampaignLedgersApiEndpoint } from './endpoints/campaign-ledgers-api-endpoint';
import { CropCampaignsApiEndpoint } from './endpoints/crop-campaigns-api-endpoint';
import { FieldPlotsApiEndpoint } from './endpoints/field-plots-api-endpoint';

/**
 * Infrastructure facade for field plot, crop campaign and cost ledger endpoint operations.
 */
@Injectable({ providedIn: 'root' })
export class FieldManagementApi extends BaseApi {
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
  createPlot = (plot: FieldPlot): Observable<FieldPlot> => this.plotsEndpoint.create(plot).pipe(
    tap(() => this.plotRevision.update((revision) => revision + 1)),
  );

  /**
   * Updates an existing plot.
   * @param plot - The plot to update.
   * @returns An Observable of the updated FieldPlot object.
   */
  updatePlot = (plot: FieldPlot): Observable<FieldPlot> => this.plotsEndpoint.update(plot, plot.id).pipe(
    tap(() => this.plotRevision.update((revision) => revision + 1)),
  );

  /**
   * Deletes a plot by ID.
   * @param id - The ID of the plot to delete.
   * @returns An Observable of void.
   */
  deletePlot = (id: number): Observable<void> => this.plotsEndpoint.delete(id).pipe(
    tap(() => this.plotRevision.update((revision) => revision + 1)),
  );

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

  /**
   * Deletes a campaign by ID.
   * @param id - The ID of the campaign to delete.
   * @returns An Observable of void.
   */
  deleteCampaign = (id: number): Observable<void> => this.campaignsEndpoint.delete(id);

  /**
   * Downloads the cost report of a campaign.
   * @param campaignId - Campaign of the report.
   * @returns An Observable of the report file.
   */
  downloadCostReport = (campaignId: number): Observable<Blob> =>
    this.campaignsEndpoint.getCostReport(campaignId);

  /**
   * Retrieves the cost ledger of one campaign.
   * @param campaignId - Campaign of the ledger.
   * @returns An Observable of the ledger, or `null` if the campaign has none.
   */
  getLedgerByCampaign = (campaignId: number): Observable<CampaignLedger | null> =>
    this.ledgersEndpoint.getByCampaign(campaignId);

  /**
   * Retrieves a single cost ledger by ID.
   * @param id - The ID of the ledger.
   * @returns An Observable of the CampaignLedger object.
   */
  getLedgerById = (id: number): Observable<CampaignLedger> => this.ledgersEndpoint.getById(id);

  /**
   * Creates a new cost ledger.
   * @param ledger - The ledger to create.
   * @returns An Observable of the created CampaignLedger object.
   */
  createLedger = (ledger: CampaignLedger): Observable<CampaignLedger> =>
    this.ledgersEndpoint.create(ledger);

  /**
   * Updates an existing cost ledger.
   * @param ledger - The ledger to update.
   * @returns An Observable of the updated CampaignLedger object.
   */
  updateLedger = (ledger: CampaignLedger): Observable<CampaignLedger> =>
    this.ledgersEndpoint.update(ledger, ledger.id);

  /**
   * Deletes a cost ledger by ID.
   * @param id - The ID of the ledger to delete.
   * @returns An Observable of void.
   */
  deleteLedger = (id: number): Observable<void> => this.ledgersEndpoint.delete(id);
}
