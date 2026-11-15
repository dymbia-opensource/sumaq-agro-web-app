import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export interface PotatoCaliberGradingData {
  firstPercentage: number;
  secondPercentage: number;
  thirdPercentage: number;
  weevilDamagePercentage: number;
}

export class PotatoCaliberGrading extends BaseEntity {
  constructor(
    id: number,
    readonly data: PotatoCaliberGradingData,
  ) {
    super({ id });
  }

  get totalPercentage(): number {
    return this.data.firstPercentage + this.data.secondPercentage + this.data.thirdPercentage;
  }

  get isValid(): boolean {
    return (
      Math.abs(this.totalPercentage - 100) < 0.01 &&
      Object.values(this.data).every((percentage) => percentage >= 0 && percentage <= 100)
    );
  }
}
