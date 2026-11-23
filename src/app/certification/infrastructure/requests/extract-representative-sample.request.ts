/** Payload sent to record the sample of a batch (`POST /harvest-batches/{id}/sample`). */
export interface ExtractRepresentativeSampleRequest {
  sampleIdentifier: string;
  sampleWeightKg: number;
}
