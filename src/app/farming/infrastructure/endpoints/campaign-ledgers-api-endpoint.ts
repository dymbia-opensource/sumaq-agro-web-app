import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { RecordDailyLaborExpenseCommand } from '../../domain/model/commands/record-daily-labor-expense.command';
import { RecordFieldFreightExpenseCommand } from '../../domain/model/commands/record-field-freight-expense.command';
import { RecordInputExpenseCommand } from '../../domain/model/commands/record-input-expense.command';
import { CampaignLedger } from '../../domain/model/entities/campaign-ledger.entity';
import { CampaignLedgerAssembler } from '../assemblers/campaign-ledger-assembler';
import { EstimateCampaignYieldRequest } from '../requests/estimate-campaign-yield.request';
import {
  CampaignLedgerResource,
  CampaignLedgersResponse,
} from '../responses/campaign-ledgers-response';

/**
 * HTTP endpoint for the cost ledgers resource (`/campaign-ledgers`).
 *
 * @remarks
 * A ledger is never created from the web app: the platform opens it when its
 * campaign starts and freezes it when the campaign closes. Every command
 * answers with the whole ledger, already recalculated. The errors of the
 * commands reach the store untouched, so it can show the reason the platform
 * gives (for example 409 when the ledger is frozen).
 */
export class CampaignLedgersApiEndpoint extends BaseApiEndpoint<
  CampaignLedger,
  CampaignLedgerResource,
  CampaignLedgersResponse,
  CampaignLedgerAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCampaignLedgersEndpointPath}`,
      new CampaignLedgerAssembler(),
    );
  }

  /**
   * Loads the cost ledger of one campaign, a sub-resource of the campaign
   * (`GET /crop-campaigns/{id}/campaign-ledger`).
   * @param campaignId - Campaign of the ledger.
   * @returns The ledger, or `null` if the campaign has none.
   */
  getByCampaign(campaignId: number): Observable<CampaignLedger | null> {
    const url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderCropCampaignsEndpointPath}/${campaignId}/campaign-ledger`;
    return this.http.get<CampaignLedgerResource>(url).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((error: HttpErrorResponse) =>
        error.status === 404
          ? of(null)
          : this.handleError('Failed to fetch the cost ledger of the campaign')(error),
      ),
    );
  }

  /**
   * Records an input expense (US-37).
   * @param command - Input bought.
   * @returns The recalculated ledger.
   */
  recordInputExpense(command: RecordInputExpenseCommand): Observable<CampaignLedger> {
    return this.post(
      command.ledgerId,
      '/expenses/inputs',
      this.assembler.toInputExpenseRequestFromCommand(command),
    );
  }

  /**
   * Records a daily labor expense (US-38).
   * @param command - Wages of a field activity.
   * @returns The recalculated ledger.
   */
  recordDailyLaborExpense(command: RecordDailyLaborExpenseCommand): Observable<CampaignLedger> {
    return this.post(
      command.ledgerId,
      '/expenses/labor',
      this.assembler.toDailyLaborExpenseRequestFromCommand(command),
    );
  }

  /**
   * Records a field freight expense (US-39).
   * @param command - Cost of one freight.
   * @returns The recalculated ledger.
   */
  recordFieldFreightExpense(command: RecordFieldFreightExpenseCommand): Observable<CampaignLedger> {
    return this.post(
      command.ledgerId,
      '/expenses/freight',
      this.assembler.toFieldFreightExpenseRequestFromCommand(command),
    );
  }

  /**
   * Replaces the expected and actual yield, which update the breakeven price (US-40).
   * @param ledgerId - Ledger of the campaign.
   * @param request - Both yields.
   * @returns The recalculated ledger.
   */
  estimateYield(ledgerId: number, request: EstimateCampaignYieldRequest): Observable<CampaignLedger> {
    return this.http
      .put<CampaignLedgerResource>(`${this.endpointUrl}/${ledgerId}/yield-estimate`, request)
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  private post(ledgerId: number, path: string, body: object): Observable<CampaignLedger> {
    return this.http
      .post<CampaignLedgerResource>(`${this.endpointUrl}/${ledgerId}${path}`, body)
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }
}
