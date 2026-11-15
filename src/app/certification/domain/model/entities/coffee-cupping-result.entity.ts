import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export interface CoffeeCuppingResultData {
  aroma: number;
  flavor: number;
  acidity: number;
  body: number;
  totalScore: number;
}

export class CoffeeCuppingResult extends BaseEntity {
  constructor(
    id: number,
    readonly data: CoffeeCuppingResultData,
  ) {
    super({ id });
  }

  get isSpecialty(): boolean {
    return this.data.totalScore >= 80;
  }
}
