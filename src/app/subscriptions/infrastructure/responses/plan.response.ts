import { PlanCode } from '../../domain/model/entities/plan-code';

export interface PlanResource {
  code: PlanCode;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  registeredPlotLimit: number;
  producerLimit: number;
  supervisedPlotLimit: number;
}
