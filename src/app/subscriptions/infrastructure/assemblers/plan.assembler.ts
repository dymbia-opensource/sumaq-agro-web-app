import { Money } from '../../../shared/domain/model/money';
import { PlanCode } from '../../domain/model/entities/plan-code';
import { Plan } from '../../domain/model/entities/plan.entity';
import { PlanResource } from '../responses/plan.response';

/** Translation keys for the feature descriptions shown on the catalog cards. */
const PLAN_FEATURES: Record<PlanCode, string[]> = {
  SEED: ['campaigns-by-plot', 'ndvi-ndwi', 'expenses', 'unit-cost', 'agroclimatic-alerts'],
  COOPERATIVE_PRO: [
    'members-registry',
    'ndvi-ndwi',
    'incidents-inspections',
    'harvest-lots',
    'qr-certificates',
  ],
  TECHNICAL_ADVISOR: ['ndvi-ndwi', 'pest-reports', 'inspections', 'prescriptions', 'visit-history'],
};

export class PlanAssembler {
  toEntityFromResource = (resource: PlanResource): Plan =>
    new Plan({
      code: resource.code,
      monthlyPrice: new Money(resource.monthlyPrice, resource.currency),
      annualPrice: new Money(resource.annualPrice, resource.currency),
      plotQuota: resource.registeredPlotLimit,
      features: PLAN_FEATURES[resource.code],
    });
}
