import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IssueTechnicalPrescriptionCommand } from '../domain/model/commands/issue-technical-prescription.command';
import { RecordPestReportCommand } from '../domain/model/commands/record-pest-report.command';
import { RequestSatelliteObservationImportCommand } from '../domain/model/commands/request-satellite-observation-import.command';
import { ScheduleFieldInspectionCommand } from '../domain/model/commands/schedule-field-inspection.command';
import { PestReport } from '../domain/model/entities/pest-report.entity';
import { RegionalBulletin } from '../domain/model/entities/regional-bulletin';
import { AgroclimaticAlertsApiEndpoint } from './endpoints/agroclimatic-alert.endpoint';
import { ClimateForecastsApiEndpoint } from './endpoints/climate-forecast.endpoint';
import { FieldInspectionsApiEndpoint } from './endpoints/field-inspection.endpoint';
import { PestReportsApiEndpoint } from './endpoints/pest-report.endpoint';
import { SatelliteObservationsApiEndpoint } from './endpoints/satellite-observation.endpoint';
import { TechnicalPrescriptionsApiEndpoint } from './endpoints/technical-prescription.endpoint';

@Injectable({ providedIn: 'root' })
export class CropApi {
  private readonly http = inject(HttpClient);
  private readonly alerts = new AgroclimaticAlertsApiEndpoint(this.http);
  private readonly forecasts = new ClimateForecastsApiEndpoint(this.http);
  private readonly reports = new PestReportsApiEndpoint(this.http);
  private readonly inspections = new FieldInspectionsApiEndpoint(this.http);
  private readonly observations = new SatelliteObservationsApiEndpoint(this.http);
  private readonly prescriptions = new TechnicalPrescriptionsApiEndpoint(this.http);
  private readonly bulletinsUrl = environment.platformProviderApiBaseUrl + '/regional-bulletins';

  getObservationsByPlot = (plotId: number) => this.observations.getByPlot(plotId);
  requestObservationImport = (command: RequestSatelliteObservationImportCommand) =>
    this.observations.requestImport(command);
  importObservation = (plotId: number, start: string, end: string) =>
    this.observations.importLatest(plotId, start, end);

  getPestReportsByPlot = (plotId: number) => this.reports.getByPlot(plotId);
  getPestReport = (id: number) => this.reports.getById(id);
  recordReport = (command: RecordPestReportCommand) => this.reports.create(new PestReport(command));
  deleteReport = (id: number) => this.reports.delete(id);

  getInspectionsByPlot = (plotId: number) => this.inspections.getByPlot(plotId);
  scheduleInspection = (command: ScheduleFieldInspectionCommand, agronomistId: number) =>
    this.inspections.schedule(command, agronomistId);
  completeInspection = (id: number, findings: string) => this.inspections.complete(id, findings);

  getPrescriptionsByPlot = (plotId: number) => this.prescriptions.getByPlot(plotId);
  issuePrescription = (command: IssueTechnicalPrescriptionCommand) =>
    this.prescriptions.issue(command);
  applyPrescription = (id: number) => this.prescriptions.apply(id);

  getAlertsByRegion = (region: string) => this.alerts.getByRegion(region);
  getForecastsByRegion = (region: string) => this.forecasts.getByRegion(region);
  importForecasts = (plotId: number) => this.forecasts.importForPlot(plotId);
  getBulletinsByRegion = (region: string) =>
    this.http.get<RegionalBulletin[]>(this.bulletinsUrl, { params: { region } });
  publishBulletin = (body: Omit<RegionalBulletin, 'id' | 'publishedAt'>) =>
    this.http.post<RegionalBulletin>(this.bulletinsUrl, body);
}
