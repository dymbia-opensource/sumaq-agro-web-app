/**
 * Payload sent to record an input expense
 * (`POST /campaign-ledgers/{id}/expenses/inputs`, US-37).
 */
export interface RecordInputExpenseRequest {
  /** Seed, fertilizer or pesticide bought. */
  inputName: string;
  /** Quantity bought. */
  quantity: number;
  /** Price per unit. */
  unitPrice: number;
  /** Date in `YYYY-MM-DD` format. */
  expenseDate: string;
  /** Code generated on the device; the platform records the expense once. */
  clientSyncId: string;
}
