import { PlanCode } from '../entities/plan-code';

export type SubscriptionSegment = 'INDEPENDENT_FARMER' | 'COOPERATIVE' | 'TECHNICAL_ADVISOR';

const PLAN_BY_SEGMENT: Readonly<Record<SubscriptionSegment, PlanCode>> = {
  INDEPENDENT_FARMER: PlanCode.SEED,
  COOPERATIVE: PlanCode.COOPERATIVE_PRO,
  TECHNICAL_ADVISOR: PlanCode.TECHNICAL_ADVISOR,
};

/** Returns the plan available for the given subscription segment. */
export function planForSegment(segment: SubscriptionSegment): PlanCode {
  return PLAN_BY_SEGMENT[segment];
}
