import { SoilTexture } from '../entities/field-plot.entity';

/**
 * Records the initial soil analysis of a plot.
 */
export class RecordSoilBaselineCommand {
  readonly plotId: number;
  /** pH of the soil, between 0 and 14. */
  readonly ph: number;
  readonly texture: SoilTexture;
  /** Organic matter, from 0 to 100 %. */
  readonly organicMatterPercentage: number;
  /** Date of the analysis. */
  readonly recordedAt: Date;

  constructor(props: {
    plotId: number;
    ph: number;
    texture: SoilTexture;
    organicMatterPercentage: number;
    recordedAt: Date;
  }) {
    this.plotId = props.plotId;
    this.ph = props.ph;
    this.texture = props.texture;
    this.organicMatterPercentage = props.organicMatterPercentage;
    this.recordedAt = props.recordedAt;
  }
}
