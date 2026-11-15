import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface FieldInspectionResource extends BaseResource {
  id: number;
  reportId: number;
  scheduledAt: string;
  notes: string;
  status?: 'SCHEDULED' | 'COMPLETED';
  completedAt?: string | null;
  inspectorUserId?: number | null;
}

export interface FieldInspectionsResponse extends BaseResponse {
  inspections: FieldInspectionResource[];
}
