import { FieldInspection } from '../../domain/model/entities/field-inspection.entity';
import { FieldInspectionResource } from '../responses/field-inspection.response';

export class FieldInspectionAssembler {
  toEntityFromResource = (resource: FieldInspectionResource): FieldInspection =>
    new FieldInspection({
      id: resource.id,
      reportId: resource.pestReportId,
      plotId: resource.plotId,
      scheduledAt: resource.scheduledAt,
      notes: resource.findings ?? '',
      status: resource.status,
      completedAt: resource.completedAt,
      inspectorUserId: resource.agronomistId,
    });
}
