/**
 * Registers a new plot for the producer.
 */
export class RegisterFieldPlotCommand {
  /** Producer who owns the plot. */
  readonly ownerUserId: number;
  /** Name of the plot. */
  readonly name: string;
  /** Region or valley of the plot. */
  readonly region: string;
  /** Area the producer declares, in hectares, until the GPS polygon is marked. */
  readonly declaredAreaHectares: number;

  constructor(props: {
    ownerUserId: number;
    name: string;
    region: string;
    declaredAreaHectares?: number;
  }) {
    this.ownerUserId = props.ownerUserId;
    this.name = props.name;
    this.region = props.region;
    this.declaredAreaHectares = props.declaredAreaHectares ?? 0;
  }
}
