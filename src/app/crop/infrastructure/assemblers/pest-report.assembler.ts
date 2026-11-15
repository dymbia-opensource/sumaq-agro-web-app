import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { PestReport } from '../../domain/model/entities/pest-report.entity';
import { PestReportResource, PestReportsResponse } from '../responses/pest-report.response';

export class PestReportAssembler implements BaseAssembler<
  PestReport,
  PestReportResource,
  PestReportsResponse
> {
  toEntityFromResource(resource: PestReportResource, plotName = resource.plotName): PestReport {
    return new PestReport({
      id: resource.id,
      plotId: resource.plotId,
      plotName,
      reporterId: resource.reporterId,
      description: resource.description,
      severity: resource.severity,
      status: resource.status,
      photo: resource.photo,
      clientSyncId: resource.clientSyncId,
    });
  }
  toResourceFromEntity(entity: PestReport): PestReportResource {
    return {
      id: entity.id as number,
      plotId: entity.plotId,
      plotName: entity.plotName,
      reporterId: entity.reporterId,
      description: entity.description,
      severity: entity.severity,
      status: entity.status,
      photo: entity.photo,
      clientSyncId: entity.clientSyncId,
    };
  }
  toEntitiesFromResponse(response: PestReportsResponse): PestReport[] {
    return response.reports.map((r) => this.toEntityFromResource(r));
  }
}
