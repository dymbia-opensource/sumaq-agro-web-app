import { TechnicalPrescriptionProps } from '../../domain/model/entities/technical-prescription.entity';

export type TechnicalPrescriptionResource = Omit<TechnicalPrescriptionProps, 'reportId'> & {
  pestReportId: number;
};
