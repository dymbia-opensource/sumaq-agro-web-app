import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface TechnicalPrescriptionResource extends BaseResource {
  id: number;
  reportId: number;
  agronomistId: number;
  recommendedProducts: string;
  dosageInstructions: string;
  applicationDate: string;
}

export interface TechnicalPrescriptionsResponse extends BaseResponse {
  prescriptions: TechnicalPrescriptionResource[];
}
