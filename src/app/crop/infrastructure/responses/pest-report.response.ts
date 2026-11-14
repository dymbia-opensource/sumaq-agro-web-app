import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface PestReportResource extends BaseResource {
  id: number;
  plotId: number;
  plotName: string;
  reporterId: number;
  description: string;
  severity: string;
  status: string;
  photo: string;
  clientSyncId: string;
}

export interface PestReportsResponse extends BaseResponse {
  reports: PestReportResource[];
}
