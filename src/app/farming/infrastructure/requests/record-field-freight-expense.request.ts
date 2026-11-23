/**
 * Payload sent to record a field freight expense
 * (`POST /campaign-ledgers/{id}/expenses/freight`, US-39).
 */
export interface RecordFieldFreightExpenseRequest {
  /** Route of the freight, for example field to collection center. */
  route: string;
  /** Cost of the freight. */
  cost: number;
  /** Date in `YYYY-MM-DD` format. */
  expenseDate: string;
  /** Code generated on the device; the platform records the expense once. */
  clientSyncId: string;
}
