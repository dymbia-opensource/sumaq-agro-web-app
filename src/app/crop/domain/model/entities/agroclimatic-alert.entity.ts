import { requireText, requireDate, requireChoice } from '../validation';
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Properties required to create or hydrate an {@link AgroclimaticAlert}.
 */
export interface AgroclimaticAlertProps {
  id?: number | string;
  title: string;
  description: string;
  severity?: string;
  region: string;
  issuedAt?: string;
  source?: string;
}

/**
 * Domain entity representing an agroclimatic alert emitted by meteorological services.
 *
 * @remarks
 * Alerts can warn producers about frosts, heatwaves, or unexpected heavy rains.
 */
export class AgroclimaticAlert extends BaseEntity {
  private _title: string;
  private _description: string;
  private _severity: string;
  private _region: string;
  private _issuedAt: string;
  private _source: string;

  /**
   * Initializes a new instance of the {@link AgroclimaticAlert} class.
   *
   * @param props - Properties to initialize the entity.
   */
  constructor(props: AgroclimaticAlertProps) {
    super({ id: props.id ?? 0 });
    requireText(props.title);
    requireText(props.description);
    requireText(props.region);
    requireChoice(props.severity ?? 'LOW', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    if (props.issuedAt !== undefined) requireDate(props.issuedAt);
    this._title = props.title;
    this._description = props.description;
    this._severity = props.severity ?? 'LOW';
    this._region = props.region;
    this._issuedAt = props.issuedAt ?? new Date().toISOString();
    this._source = props.source ?? 'SENAMHI';
  }

  /** Gets the headline or title of the alert. */
  get title(): string {
    return this._title;
  }

  /** Gets the detailed description and protective guidelines. */
  get description(): string {
    return this._description;
  }

  /** Gets the severity level (LOW, MEDIUM, HIGH, CRITICAL). */
  get severity(): string {
    return this._severity;
  }

  /** Gets the affected geographic valley or region. */
  get region(): string {
    return this._region;
  }

  /** Gets the timestamp when the alert was published. */
  get issuedAt(): string {
    return this._issuedAt;
  }

  /** Gets the authority or data source that generated the alert. */
  get source(): string {
    return this._source;
  }
}
