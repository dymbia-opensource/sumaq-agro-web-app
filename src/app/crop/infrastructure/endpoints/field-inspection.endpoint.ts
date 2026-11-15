import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ScheduleFieldInspectionCommand } from '../../domain/model/commands/schedule-field-inspection.command';
import { FieldInspectionAssembler } from '../assemblers/field-inspection.assembler';
import { FieldInspectionResource } from '../responses/field-inspection.response';

export class FieldInspectionsApiEndpoint {
  private readonly url =
    environment.platformProviderApiBaseUrl +
    environment.platformProviderFieldInspectionsEndpointPath;
  private readonly assembler = new FieldInspectionAssembler();
  constructor(private readonly http: HttpClient) {}

  getByPlot(plotId: number) {
    return this.http
      .get<FieldInspectionResource[]>(this.url, { params: { plotId } })
      .pipe(map((items) => items.map(this.assembler.toEntityFromResource)));
  }

  schedule(command: ScheduleFieldInspectionCommand, agronomistId: number) {
    return this.http
      .post<FieldInspectionResource>(this.url, {
        pestReportId: command.reportId,
        agronomistId,
        scheduledAt: command.scheduledAt,
      })
      .pipe(map(this.assembler.toEntityFromResource));
  }

  complete(id: number, findings: string) {
    return this.http
      .patch<FieldInspectionResource>(this.url + '/' + id + '/completion', { findings })
      .pipe(map(this.assembler.toEntityFromResource));
  }
}
