/** Records the representative sample taken from a weighed batch. */
export class ExtractRepresentativeSampleCommand {
  readonly batchId: number;
  readonly sampleIdentifier: string;
  readonly sampleWeightKg: number;

  constructor(props: { batchId: number; sampleIdentifier: string; sampleWeightKg: number }) {
    const sampleIdentifier = props.sampleIdentifier.trim();
    if (!sampleIdentifier || !(props.sampleWeightKg > 0)) {
      throw new Error('certification.workspace.invalid');
    }
    this.batchId = props.batchId;
    this.sampleIdentifier = sampleIdentifier;
    this.sampleWeightKg = props.sampleWeightKg;
  }
}
