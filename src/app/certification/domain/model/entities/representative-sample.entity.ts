import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export class RepresentativeSample extends BaseEntity {
  constructor(
    id: number,
    readonly harvestBatchId: number,
    readonly weightKg: number,
    readonly extractedAt: string,
  ) {
    super({ id });
    // Una muestra sin peso positivo no puede usarse para la calificación.
    if (weightKg <= 0) throw new Error('La muestra debe tener un peso positivo.');
  }
}
