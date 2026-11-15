/**
 * Command to publish or record an agroclimatic alert for a farming region.
 */
export class IssueAgroclimaticAlertCommand {
  /** Alert headline. */
  readonly title: string;
  /** Detailed warning description. */
  readonly description: string;
  /** Severity degree (LOW, MEDIUM, HIGH, CRITICAL). */
  readonly severity: string;
  /** Target valley or region. */
  readonly region: string;
  /** Source meteorological entity. */
  readonly source?: string;

  /**
   * Initializes a new instance of {@link IssueAgroclimaticAlertCommand}.
   *
   * @param props - Command payload.
   */
  constructor(props: {
    title: string;
    description: string;
    severity?: string;
    region: string;
    source?: string;
  }) {
    this.title = props.title;
    this.description = props.description;
    this.severity = props.severity ?? 'LOW';
    this.region = props.region;
    this.source = props.source ?? 'SENAMHI';
  }
}
