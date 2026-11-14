import { requireId, requireText, requireDate, requireChoice } from '../validation';
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Properties required to instantiate a {@link FieldInspection}.
 */
export interface FieldInspectionProps {
  id?: number | string;
  reportId: number;
  scheduledAt: string;
  notes?: string;
  status?: 'SCHEDULED' | 'COMPLETED';
  completedAt?: string | null;
  inspectorUserId?: number | null;
}

/**
 * Domain entity representing an agronomist technical on-site visit to inspect a reported issue.
 */
export class FieldInspection extends BaseEntity {
  private _reportId: number;
  private _scheduledAt: string;
  private _notes: string;
  private _status: 'SCHEDULED' | 'COMPLETED';
  private _completedAt: string | null;
  private _inspectorUserId: number | null;

  /**
   * Initializes a new instance of the {@link FieldInspection} class.
   *
   * @param props - Field inspection properties.
   */
  constructor(props: FieldInspectionProps) {
    super({ id: props.id ?? 0 });
    requireId(props.reportId);
    requireDate(props.scheduledAt);
    requireChoice(props.status ?? 'SCHEDULED', ['SCHEDULED', 'COMPLETED']);
    if (props.status === 'COMPLETED') {
      requireDate(props.completedAt ?? '');
      requireId(props.inspectorUserId ?? 0);
      requireText(props.notes ?? '', 10);
      if (Date.parse(props.completedAt!) < Date.parse(props.scheduledAt))
        throw new Error('crop.errors.invalid-data');
    }
    this._reportId = props.reportId;
    this._scheduledAt = props.scheduledAt;
    this._notes = props.notes ?? '';
    this._status = props.status ?? 'SCHEDULED';
    this._completedAt = props.completedAt ?? null;
    this._inspectorUserId = props.inspectorUserId ?? null;
  }

  /** Gets the related pest report identifier. */
  get reportId(): number {
    return this._reportId;
  }

  /** Gets the scheduled date and time for the technical visit. */
  get scheduledAt(): string {
    return this._scheduledAt;
  }

  /** Gets technical diagnosis notes or agronomist recommendations. */
  get notes(): string {
    return this._notes;
  }
  get status(): 'SCHEDULED' | 'COMPLETED' {
    return this._status;
  }
  get completedAt(): string | null {
    return this._completedAt;
  }
  get inspectorUserId(): number | null {
    return this._inspectorUserId;
  }
  complete(notes: string, inspectorUserId: number, completedAt = new Date().toISOString()): void {
    if (this._status !== 'SCHEDULED') throw new Error('crop.errors.invalid-transition');
    requireText(notes, 10);
    requireId(inspectorUserId);
    requireDate(completedAt);
    if (Date.parse(completedAt) < Date.parse(this._scheduledAt))
      throw new Error('crop.errors.visit-not-due');
    this._notes = notes.trim();
    this._inspectorUserId = inspectorUserId;
    this._completedAt = completedAt;
    this._status = 'COMPLETED';
  }
}
