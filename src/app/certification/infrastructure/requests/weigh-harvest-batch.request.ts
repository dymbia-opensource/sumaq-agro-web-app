/** Payload sent to weigh a batch (`POST /harvest-batches/{id}/weight`). */
export interface WeighHarvestBatchRequest {
  grossWeightKg: number;
  tareKg: number;
}
