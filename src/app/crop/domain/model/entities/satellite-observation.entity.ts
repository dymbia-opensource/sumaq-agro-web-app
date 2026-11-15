import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { requireDate, requireId, requireRange } from '../validation';

interface SatelliteObservationProps {
  id: number;
  plotId: number;
  date: string;
  source: string;
  ndviMean: number | null;
  ndwiMean: number | null;
  cloudCoveragePercent: number | null;
  surfaceTempKelvin: number | null;
}

export class SatelliteObservation extends BaseEntity {
  readonly plotId: number;
  readonly date: string;
  readonly source: string;
  readonly ndviMean: number | null;
  readonly ndwiMean: number | null;
  readonly cloudCoveragePercent: number | null;
  readonly surfaceTempKelvin: number | null;

  constructor(props: SatelliteObservationProps) {
    super({ id: props.id });
    requireId(props.plotId);
    requireDate(props.date);
    if (props.ndviMean !== null) requireRange(props.ndviMean, -1, 1);
    if (props.ndwiMean !== null) requireRange(props.ndwiMean, -1, 1);
    if (props.cloudCoveragePercent !== null) requireRange(props.cloudCoveragePercent, 0, 100);
    if (props.surfaceTempKelvin !== null) requireRange(props.surfaceTempKelvin, 0);
    this.plotId = props.plotId;
    this.date = props.date;
    this.source = props.source;
    this.ndviMean = props.ndviMean;
    this.ndwiMean = props.ndwiMean;
    this.cloudCoveragePercent = props.cloudCoveragePercent;
    this.surfaceTempKelvin = props.surfaceTempKelvin;
  }
}
