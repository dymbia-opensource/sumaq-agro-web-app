/** Payload sent to register a batch (`POST /harvest-batches`). */
export interface RegisterHarvestBatchRequest {
  batchCode: string;
  cooperativeId: number;
  memberId: number;
  plotId: number;
  cropType: string;
  /** Date in `YYYY-MM-DD` format. */
  harvestedOn: string;
}
