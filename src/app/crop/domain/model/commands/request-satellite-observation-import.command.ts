import { requireId } from '../validation';

/** Requests the latest available satellite capture for a plot without specifying dates. */
export class RequestSatelliteObservationImportCommand {
  readonly plotId: number;

  constructor(props: { plotId: number }) {
    requireId(props.plotId);
    this.plotId = props.plotId;
  }
}
