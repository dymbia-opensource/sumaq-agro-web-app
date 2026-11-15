import { PlotAdvisorAssignment } from '../../domain/model/entities/plot-advisor-assignment';
import { PlotAdvisorAssignmentResource } from '../responses/plot-advisor-assignment.response';

/** Maps the supervision of a plot between the domain and the API. */
export class PlotAdvisorAssignmentAssembler {
  static toEntity(resource: PlotAdvisorAssignmentResource): PlotAdvisorAssignment {
    return {
      id: resource.id,
      cooperativeId: resource.cooperativeId,
      plotId: resource.plotId,
      producerUserId: resource.producerUserId,
      advisorUserId: resource.agronomistUserId,
      status: resource.status,
      assignedAt: resource.assignedAt,
      history: (resource.history ?? []).map((period) => ({
        advisorUserId: period.agronomistUserId,
        assignedAt: period.assignedAt,
        endedAt: period.endedAt,
      })),
    };
  }
}
