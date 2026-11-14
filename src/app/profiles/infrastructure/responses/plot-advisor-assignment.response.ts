/** One closed period of supervision, as the API names its fields. */
export interface AgronomistAssignmentHistoryResource {
  agronomistUserId: number;
  assignedAt: string;
  endedAt: string;
}

/**
 * Supervision of a plot as the API sends it.
 *
 * @remarks
 * The API calls the professional an agronomist; the domain of this context
 * calls him the advisor of the plot. The assembler is the only place where
 * both names meet.
 */
export interface PlotAdvisorAssignmentResource {
  id: number;
  plotId: number;
  producerUserId: number;
  agronomistUserId: number;
  status: 'ACTIVE' | 'INACTIVE';
  assignedAt: string;
  history: AgronomistAssignmentHistoryResource[];
}
