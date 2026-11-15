/**
 * Command to record a new pest or phytosanitary disease incidence for a plot.
 */
export class RecordPestReportCommand {
  /** Identifier of the target plot. */
  readonly plotId: number;
  /** Name of the plot. */
  readonly plotName: string;
  /** User ID of the producer or technician filing the report. */
  readonly reporterId: number;
  /** Detailed description of observed damage or symptoms. */
  readonly description: string;
  /** Severity level (e.g. LOW, MEDIUM, HIGH, SEVERE). */
  readonly severity: string;
  /** Optional URL or base64 photo evidence. */
  readonly photo?: string;
  /** Optional client synchronization identifier for offline support. */
  readonly clientSyncId?: string;

  /**
   * Initializes a new instance of {@link RecordPestReportCommand}.
   *
   * @param props - Command payload.
   */
  constructor(props: {
    plotId: number;
    plotName?: string;
    reporterId: number;
    description: string;
    severity?: string;
    photo?: string;
    clientSyncId?: string;
  }) {
    this.plotId = props.plotId;
    this.plotName = props.plotName ?? '';
    this.reporterId = props.reporterId;
    this.description = props.description;
    this.severity = props.severity ?? 'MEDIUM';
    this.photo = props.photo;
    this.clientSyncId = props.clientSyncId;
  }
}
