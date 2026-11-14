/**
 * Records the daily wages paid to the field workers.
 */
export class RecordDailyLaborExpenseCommand {
  readonly ledgerId: number;
  /** Field task, for example "Harvest" (US-38). */
  readonly activity: string;
  /** Number of workers. */
  readonly workers: number;
  /** Number of days worked. */
  readonly days: number;
  /** Wage per worker per day, in soles. */
  readonly dailyWage: number;
  readonly expenseDate: Date;
  /**
   * Code generated on the device; it keeps the expense from being saved twice
   * when it is recorded offline and synchronized later.
   */
  readonly clientSyncId: string;

  constructor(props: {
    ledgerId: number;
    activity: string;
    workers: number;
    days: number;
    dailyWage: number;
    expenseDate: Date;
    clientSyncId?: string;
  }) {
    this.ledgerId = props.ledgerId;
    this.activity = props.activity;
    this.workers = props.workers;
    this.days = props.days;
    this.dailyWage = props.dailyWage;
    this.expenseDate = props.expenseDate;
    this.clientSyncId = props.clientSyncId ?? crypto.randomUUID();
  }
}
