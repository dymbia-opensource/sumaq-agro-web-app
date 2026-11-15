import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IssueTechnicalPrescriptionCommand } from '../../domain/model/commands/issue-technical-prescription.command';
import { TechnicalPrescriptionAssembler } from '../assemblers/technical-prescription.assembler';
import { TechnicalPrescriptionResource } from '../responses/technical-prescription.response';

export class TechnicalPrescriptionsApiEndpoint {
  private readonly url =
    environment.platformProviderApiBaseUrl +
    environment.platformProviderTechnicalPrescriptionsEndpointPath;
  private readonly assembler = new TechnicalPrescriptionAssembler();
  constructor(private readonly http: HttpClient) {}

  getByPlot(plotId: number) {
    return this.http
      .get<TechnicalPrescriptionResource[]>(this.url, { params: { plotId } })
      .pipe(map((items) => items.map(this.assembler.toEntityFromResource)));
  }

  issue(command: IssueTechnicalPrescriptionCommand) {
    const { reportId, agronomistId, product, dosage, instructions, applicationDate } = command;
    return this.http
      .post<TechnicalPrescriptionResource>(this.url, {
        pestReportId: reportId,
        agronomistId,
        product,
        dosage,
        instructions,
        applicationDate,
      })
      .pipe(map(this.assembler.toEntityFromResource));
  }

  apply(id: number) {
    return this.http
      .patch<TechnicalPrescriptionResource>(this.url + '/' + id + '/application', null)
      .pipe(map(this.assembler.toEntityFromResource));
  }
}
