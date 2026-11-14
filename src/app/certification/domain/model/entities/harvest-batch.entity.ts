import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { BatchStatus } from './batch-status';
import { CoffeeCuppingResultData } from './coffee-cupping-result.entity';
import { HarvestCropType } from './crop-type';
import { PotatoCaliberGradingData } from './potato-caliber-grading.entity';
import { QualityCategory } from './quality-category';

export type { HarvestCropType } from './crop-type';
export type { QualityCategory } from './quality-category';

export interface HarvestBatchProps {
  id: number;
  code: string;
  cooperativeId: number;
  memberId: number;
  memberName: string;
  plotId: number;
  plotName: string;
  plotRegion: string;
  coordinates: string;
  campaignId: number;
  cropType: HarvestCropType;
  variety: string;
  collectedAt: string;
  grossKg: number;
  tareKg: number;
  sampleKg: number;
  potatoGrading: PotatoCaliberGradingData | null;
  coffeeCupping: CoffeeCuppingResultData | null;
  qualityCategory: QualityCategory | null;
  status: BatchStatus;
}

export class HarvestBatch extends BaseEntity {
  constructor(readonly data: HarvestBatchProps) {
    super({ id: data.id });
  }

  get netKg(): number {
    return Math.max(0, this.data.grossKg - this.data.tareKg);
  }

  get canIssueCertificate(): boolean {
    return this.data.status === 'GRADED' && this.data.qualityCategory !== null;
  }
}
