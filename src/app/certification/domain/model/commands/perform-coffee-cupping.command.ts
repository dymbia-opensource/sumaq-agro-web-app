import { CoffeeCuppingResultData } from '../entities/coffee-cupping-result.entity';

/** Asocia el resultado de catación sensorial con el lote de café evaluado. */
export interface PerformCoffeeCuppingCommand extends CoffeeCuppingResultData {
  harvestBatchId: number;
}
