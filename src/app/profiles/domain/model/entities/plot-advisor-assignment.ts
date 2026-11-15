/** Previous responsibility retained when a producer changes the assigned professional. */
export interface AdvisorAssignmentHistory {
  advisorUserId: number;
  assignedAt: string;
  endedAt: string;
}

/**
 * Current demo authorization for one producer-owned plot.
 * @remarks
 * Account IDs are explicit and independent of professional record IDs. One record
 * per plot stores the current responsible advisor and preserves previous periods.
 * Production must enforce ownership, advisor consent and uniqueness in the API.
 */
export interface PlotAdvisorAssignment {
  id: number;
  cooperativeId: number;
  plotId: number;
  producerUserId: number;
  advisorUserId: number;
  status: 'ACTIVE' | 'INACTIVE';
  assignedAt: string;
  history: AdvisorAssignmentHistory[];
}
