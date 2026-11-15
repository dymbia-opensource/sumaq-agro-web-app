import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { FieldPlot, GeoCoordinate, SoilBaseline } from '../domain/model/entities/field-plot.entity';
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

  getLedgerById = (_id: number): Observable<CampaignLedger> =>
    throwError(() => new Error('farming.finances.pending'));

  updateLedger = (_ledger: CampaignLedger): Observable<CampaignLedger> =>
    throwError(() => new Error('farming.finances.pending'));
}
