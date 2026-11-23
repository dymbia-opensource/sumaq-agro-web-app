import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/**
 * Resource representation of one expense of a cost ledger.
 */
export interface ExpenseEntryResource extends BaseResource {
  /** Identifier of the expense inside its ledger. */
  id: number;
  /** Category (`INPUTS`, `LABOR` or `FREIGHT`). */
  category: string;
  /** What was paid for: the input, the field activity or the freight route. */
  description: string;
  /** Quantity bought or worked. */
  quantity: number;
  /** Price per unit, in the currency of the ledger. */
  unitPrice: number;
  /** Quantity by unit price, computed by the platform. */
  total: number;
  /** Date in `YYYY-MM-DD` format. */
  expenseDate: string;
  /** Optional notes. */
  notes: string | null;
  /** Code generated on the device, so an expense sent twice is recorded once. */
  clientSyncId: string | null;
}

/**
 * Resource representation of the cost ledger of a crop campaign
 * (`GET /crop-campaigns/{id}/campaign-ledger`, `GET /campaign-ledgers/{id}`).
 */
export interface CampaignLedgerResource extends BaseResource {
  /** Unique identifier of the ledger. */
  id: number;
  /** Crop campaign of the ledger. */
  cropCampaignId: number;
  /** Unit of the yield (`SACK` or `QUINTAL`). */
  yieldUnit: string;
  /** Yield the producer expects to harvest, or `null` while not estimated. */
  expectedYield: number | null;
  /** Yield actually harvested, or `null` before the harvest. */
  actualYield: number | null;
  /** `true` once the campaign is closed: the ledger accepts no more changes. */
  frozen: boolean;
  /** Currency of every amount (for example `PEN`). */
  currency: string;
  /** Sum of every expense, computed by the platform. */
  totalInvestment: number;
  /** Minimum price per unit of yield that covers the investment, computed by the platform. */
  breakevenPrice: number;
  /** Expenses of the ledger. */
  entries: ExpenseEntryResource[];
}

/**
 * Response envelope for cost ledger collection queries.
 */
export interface CampaignLedgersResponse extends BaseResponse {
  /** Cost ledger resources included in the response. */
  ledgers: CampaignLedgerResource[];
}
