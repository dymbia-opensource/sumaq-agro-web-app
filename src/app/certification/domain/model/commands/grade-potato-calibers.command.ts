import { PotatoCaliberGradingData } from '../entities/potato-caliber-grading.entity';
export interface GradePotatoCalibersCommand extends PotatoCaliberGradingData {
  harvestBatchId: number;
}
