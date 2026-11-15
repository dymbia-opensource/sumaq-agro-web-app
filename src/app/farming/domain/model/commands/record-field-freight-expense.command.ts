/**
 * Records a freight cost (inputs or harvest transport).
 */
export class RecordFieldFreightExpenseCommand {
  readonly ledgerId: number;
  /** For example, "Chacra – Acopio". */
  readonly route: string;
  /** Total cost, in soles. */
  readonly cost: number;
  readonly expenseDate: Date;
  /**
   * Code generated on the device; it keeps the expense from being saved twice
   * when it is recorded offline and synchronized later.
   */
  readonly clientSyncId: string;

  constructor(props: {
    ledgerId: number;
    route: string;
    cost: number;
    expenseDate: Date;
    clientSyncId?: string;
  }) {
    this.ledgerId = props.ledgerId;
    this.route = props.route;
    this.cost = props.cost;
    this.expenseDate = props.expenseDate;
    this.clientSyncId = props.clientSyncId ?? crypto.randomUUID();
  }
}
