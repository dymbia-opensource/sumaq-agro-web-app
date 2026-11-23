/**
 * Payload sent to record the yields of a campaign
 * (`PUT /campaign-ledgers/{id}/yield-estimate`, US-40). Both values are
 * replaced, so the one that does not change is sent again.
 */
export interface EstimateCampaignYieldRequest {
  /** Yield the producer expects to harvest. */
  expectedYield: number;
  /** Yield actually harvested, or `null` before the harvest. */
  actualYield: number | null;
}
