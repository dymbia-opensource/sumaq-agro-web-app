/**
 * Command to schedule a technical visit by an agronomist for a reported pest issue.
 */
export class ScheduleFieldInspectionCommand {
  /** Identifier of the associated pest report. */
  readonly reportId: number;
  /** ISO datetime scheduled for the visit. */
  readonly scheduledAt: string;

  /**
   * Initializes a new instance of {@link ScheduleFieldInspectionCommand}.
   *
   * @param props - Command payload.
   */
  constructor(props: { reportId: number; scheduledAt: string }) {
    this.reportId = props.reportId;
    this.scheduledAt = props.scheduledAt;
  }
}
