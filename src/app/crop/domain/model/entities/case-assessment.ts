import { requireChoice, requireDate, requireId, requireText } from '../validation';

/** Immutable professional conclusion, including the exact evidence reviewed. */
export interface CaseAssessmentData {
  id: string;
  reportId: number;
  agronomistUserId: number;
  outcome: 'FOLLOW_UP_REQUIRED' | 'RECOVERED';
  notes: string;
  evidenceIds: readonly string[];
  recordedAt: string;
}

/** Validates a professional assessment; the application validates its case relationships. */
export class CaseAssessment {
  readonly data: CaseAssessmentData;

  /** Constructs an immutable snapshot of the professional conclusion and reviewed evidence. */
  constructor(data: CaseAssessmentData) {
    requireText(data.id);
    requireId(data.reportId);
    requireId(data.agronomistUserId);
    requireChoice(data.outcome, ['FOLLOW_UP_REQUIRED', 'RECOVERED']);
    requireText(data.notes, 10);
    requireDate(data.recordedAt);
    if (
      data.notes.trim().length > 2000 ||
      !Array.isArray(data.evidenceIds) ||
      !data.evidenceIds.length
    )
      throw new Error('crop.errors.invalid-data');
    data.evidenceIds.forEach((id) => requireText(id));
    if (new Set(data.evidenceIds).size !== data.evidenceIds.length)
      throw new Error('crop.errors.invalid-data');
    this.data = Object.freeze({
      ...data,
      notes: data.notes.trim(),
      evidenceIds: Object.freeze([...data.evidenceIds]),
    });
  }
}
