/**
 * Grades an Andean potato batch by calibers. The three calibers add up to
 * 100 %; pest damage is measured apart.
 */
export class GradePotatoCalibersCommand {
  readonly batchId: number;
  readonly firstPercentage: number;
  readonly secondPercentage: number;
  readonly thirdPercentage: number;
  readonly pestDamagePercentage: number;

  constructor(props: {
    batchId: number;
    firstPercentage: number;
    secondPercentage: number;
    thirdPercentage: number;
    pestDamagePercentage: number;
  }) {
    const calibers = props.firstPercentage + props.secondPercentage + props.thirdPercentage;
    if (Math.abs(calibers - 100) > 1e-8) {
      throw new Error('certification.workspace.grade-instruction');
    }
    this.batchId = props.batchId;
    this.firstPercentage = props.firstPercentage;
    this.secondPercentage = props.secondPercentage;
    this.thirdPercentage = props.thirdPercentage;
    this.pestDamagePercentage = props.pestDamagePercentage;
  }
}
