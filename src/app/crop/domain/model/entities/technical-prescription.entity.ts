import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { requireChoice, requireDate, requireId, requireText } from '../validation';

export interface TechnicalPrescriptionProps {
  id: number;
  reportId: number;
  plotId: number;
  agronomistId: number;
  product: string;
  dosage: string;
  instructions: string;
  applicationDate: string;
  status: 'ISSUED' | 'APPLIED';
  appliedAt: string | null;
}

export class TechnicalPrescription extends BaseEntity {
  readonly reportId: number;
  readonly plotId: number;
  readonly agronomistId: number;
  readonly product: string;
  readonly dosage: string;
  readonly instructions: string;
  readonly applicationDate: string;
  readonly status: 'ISSUED' | 'APPLIED';
  readonly appliedAt: string | null;

  constructor(props: TechnicalPrescriptionProps) {
    super({ id: props.id });
    requireId(props.reportId);
    requireId(props.plotId);
    requireId(props.agronomistId);
    requireText(props.product);
    requireText(props.dosage);
    requireText(props.instructions);
    requireDate(props.applicationDate);
    requireChoice(props.status, ['ISSUED', 'APPLIED']);
    if (props.status === 'APPLIED') requireDate(props.appliedAt ?? '');
    this.reportId = props.reportId;
    this.plotId = props.plotId;
    this.agronomistId = props.agronomistId;
    this.product = props.product;
    this.dosage = props.dosage;
    this.instructions = props.instructions;
    this.applicationDate = props.applicationDate;
    this.status = props.status;
    this.appliedAt = props.appliedAt;
  }
}
