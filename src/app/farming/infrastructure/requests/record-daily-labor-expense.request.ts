/**
 * Payload sent to record a daily labor expense
 * (`POST /campaign-ledgers/{id}/expenses/labor`, US-38).
 */
export interface RecordDailyLaborExpenseRequest {
  /** Field activity, for example weeding or harvest. */
  activity: string;
  /** Number of workers. */
  workers: number;
  /** Number of days worked. */
  days: number;
  /** Wage of one worker for one day. */
  dailyWage: number;
  /** Date in `YYYY-MM-DD` format. */
  expenseDate: string;
  /** Code generated on the device; the platform records the expense once. */
  clientSyncId: string;
}
