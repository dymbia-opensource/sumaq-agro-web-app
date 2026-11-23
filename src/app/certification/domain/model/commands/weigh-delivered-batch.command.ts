/** Records the gross weight and the tare of a delivered batch. */
export class WeighDeliveredBatchCommand {
  readonly batchId: number;
  readonly grossWeightKg: number;
  readonly tareKg: number;

  constructor(props: { batchId: number; grossWeightKg: number; tareKg: number }) {
    if (!(props.grossWeightKg > props.tareKg && props.tareKg >= 0)) {
      throw new Error('certification.workspace.invalid-weight');
    }
    this.batchId = props.batchId;
    this.grossWeightKg = props.grossWeightKg;
    this.tareKg = props.tareKg;
  }
}
