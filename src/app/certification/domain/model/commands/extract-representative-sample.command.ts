/** Solicita extraer una muestra de un lote en una fecha determinada. */
export interface ExtractRepresentativeSampleCommand {
  harvestBatchId: number;
  sampleKg: number;
  extractedAt: string;
}
