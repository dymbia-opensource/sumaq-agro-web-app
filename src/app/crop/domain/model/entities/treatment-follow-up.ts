import { requireChoice, requireDate, requireId, requireText } from '../validation';

/** Farmer evidence about applying a specific prescription or its subsequent evolution. */
export interface TreatmentFollowUpData {
  id: string;
  reportId: number;
  prescriptionId: number;
  producerUserId: number;
  kind: 'APPLICATION' | 'EVOLUTION';
  occurredOn: string;
  notes: string;
  recordedAt: string;
}

/** Validates immutable evidence; recording evolution never declares clinical recovery. */
export class TreatmentFollowUp {
  readonly data: TreatmentFollowUpData;

  /** Creates evidence from API data or a validated farmer command. */
  constructor(data: TreatmentFollowUpData) {
    requireText(data.id);
    requireId(data.reportId);
    requireId(data.prescriptionId);
    requireId(data.producerUserId);
    requireChoice(data.kind, ['APPLICATION', 'EVOLUTION']);
    requireDate(data.occurredOn);
    requireDate(data.recordedAt);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.occurredOn)) throw new Error('crop.errors.invalid-data');
    requireText(data.notes, 10);
    if (data.notes.trim().length > 2000) throw new Error('crop.errors.invalid-data');
    this.data = { ...data, notes: data.notes.trim() };
  }
}
