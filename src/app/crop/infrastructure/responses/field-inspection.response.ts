export interface FieldInspectionResource {
  id: number;
  pestReportId: number;
  plotId: number;
  agronomistId: number;
  scheduledAt: string;
  status: 'SCHEDULED' | 'COMPLETED';
  findings: string | null;
  completedAt: string | null;
}
