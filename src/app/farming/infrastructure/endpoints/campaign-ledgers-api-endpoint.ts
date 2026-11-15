import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { CampaignLedger } from '../../domain/model/entities/campaign-ledger.entity';
import { CampaignLedgerAssembler } from '../assemblers/campaign-ledger-assembler';
import {
  CampaignLedgerResource,
  CampaignLedgersResponse,
} from '../responses/campaign-ledgers-response';

/** HTTP endpoint for the cost ledgers resource (`/campaign-ledgers`). */
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
   * Loads the cost ledger of one campaign. Each campaign has only one ledger.
   * @param campaignId - Campaign of the ledger.
   * @returns The ledger, or `null` if the campaign has none yet.
   */
  getByCampaign(campaignId: number): Observable<CampaignLedger | null> {
    return this.getAllBy({ campaignId }, 'Failed to fetch the cost ledger of the campaign').pipe(
      map((ledgers) => ledgers[0] ?? null),
    );
  }
}
