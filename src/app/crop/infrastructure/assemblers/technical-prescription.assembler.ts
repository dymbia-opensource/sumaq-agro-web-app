import { TechnicalPrescription } from '../../domain/model/entities/technical-prescription.entity';
import { TechnicalPrescriptionResource } from '../responses/technical-prescription.response';

export class TechnicalPrescriptionAssembler {
  toEntityFromResource = (resource: TechnicalPrescriptionResource): TechnicalPrescription =>
    new TechnicalPrescription({ ...resource, reportId: resource.pestReportId });
}
