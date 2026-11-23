/** Grades a specialty coffee batch with a cupping session. */
export class PerformCoffeeCuppingCommand {
  readonly batchId: number;
  readonly aroma: number;
  readonly flavor: number;
  readonly acidity: number;
  readonly body: number;
  readonly totalScore: number;
  readonly fermentDefect: boolean;

  constructor(props: {
    batchId: number;
    aroma: number;
    flavor: number;
    acidity: number;
    body: number;
    totalScore: number;
    fermentDefect: boolean;
  }) {
    this.batchId = props.batchId;
    this.aroma = props.aroma;
    this.flavor = props.flavor;
    this.acidity = props.acidity;
    this.body = props.body;
    this.totalScore = props.totalScore;
    this.fermentDefect = props.fermentDefect;
  }
}
