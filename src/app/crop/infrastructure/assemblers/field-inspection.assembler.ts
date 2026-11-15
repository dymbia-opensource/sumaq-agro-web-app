import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { FieldInspection } from '../../domain/model/entities/field-inspection.entity';
import {
  FieldInspectionResource,
  FieldInspectionsResponse,
} from '../responses/field-inspection.response';

export class FieldInspectionAssembler implements BaseAssembler<
  FieldInspection,
  FieldInspectionResource,
  FieldInspectionsResponse
> {
  toEntityFromResource(resource: FieldInspectionResource): FieldInspection {
    return new FieldInspection({
      id: resource.id,
      reportId: resource.reportId,
      scheduledAt: resource.scheduledAt,
      notes: resource.notes,
      status: resource.status,
      completedAt: resource.completedAt,
      inspectorUserId: resource.inspectorUserId,
    });
  }
  toResourceFromEntity(entity: FieldInspection): FieldInspectionResource {
    return {
      id: entity.id as number,
      reportId: entity.reportId,
      scheduledAt: entity.scheduledAt,
      notes: entity.notes,
      status: entity.status,
      completedAt: entity.completedAt,
      inspectorUserId: entity.inspectorUserId,
    };
  }
  toEntitiesFromResponse(response: FieldInspectionsResponse): FieldInspection[] {
    return response.inspections.map((r) => this.toEntityFromResource(r));
  }
}
