import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface AgroclimaticAlertResource extends BaseResource {
  id: number;
  title: string;
  description: string;
  severity: string;
  region: string;
  issuedAt: string;
  source: string;
}

export interface AgroclimaticAlertsResponse extends BaseResponse {
  alerts: AgroclimaticAlertResource[];
}
