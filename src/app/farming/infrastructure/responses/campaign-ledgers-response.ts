import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/**
 * Resource representation of one expense of a cost ledger.
 */
export interface ExpenseEntryResource extends BaseResource {
  /** Identifier of the expense inside its ledger. */
  id: number;
  /** Category (`INPUTS`, `LABOR` or `FREIGHT`). */
  category: string;
  /** What was paid for. */
  description: string;
  /** Quantity bought or worked. */
  quantity: number;
  /** Price per unit, in soles. */
  unitPrice: number;
  /** Date in `YYYY-MM-DD` format. */
  expenseDate: string;
  /** Optional notes. */
  notes?: string;
  /** Code generated on the device when the expense was recorded offline. */
  clientSyncId: string;
}

/**
 * Resource representation of the cost ledger of a campaign.
 */
export interface CampaignLedgerResource extends BaseResource {
  /** Unique identifier of the ledger. */
  id: number;
  /** Campaign of the ledger. */
  campaignId: number;
  /** Yield the producer expects to harvest. */
  expectedYield: number;
  /** Yield actually harvested, or `null` before the harvest. */
  actualYield: number | null;
  /** Unit of the yield (`SACK` or `QUINTAL`). */
  yieldUnit: string;
  /** `true` when the ledger is closed. */
  frozen?: boolean;
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
