import { inject, Injectable } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { ProfilesApi } from './profiles-api';
import { PlotAdvisorAssignmentsApi } from './plot-advisor-assignments.api';

export interface AdvisorSummary {
  readonly userId?: number;
  readonly name: string;
}

export interface PlotResponsibility {
  readonly plotId: number;
  readonly producerUserId: number;
  readonly advisorUserId: number;
  readonly status: 'ACTIVE' | 'INACTIVE';
}

/** Published professional read contract; profile aggregates and assignment history stay here. */
@Injectable({ providedIn: 'root' })
export class AdvisoryDirectory {
  private readonly profiles = inject(ProfilesApi);
  private readonly assignments = inject(PlotAdvisorAssignmentsApi);

  getAdvisorByUser(userId: number) {
    return this.profiles
      .getAdvisorByUser(userId)
      .pipe(
        map((advisor): AdvisorSummary | null =>
          advisor ? { userId: advisor.userId, name: advisor.name } : null,
        ),
      );
  }

  getCooperativeByDirector(userId: number) {
    return this.profiles
      .getCooperativeByDirector(userId)
      .pipe(map((cooperative) => (cooperative ? { id: Number(cooperative.id) } : null)));
  }

  getCooperativeScope(cooperativeId: number) {
    return forkJoin({
      members: this.profiles.getCooperativeMembers(cooperativeId),
      advisors: this.profiles.getTechnicalAdvisors(cooperativeId),
    }).pipe(
      map(({ members, advisors }) => ({
        plotIds: [
          ...new Set(
            members
              .filter((member) => member.active)
              .flatMap((member) => member.plots.map((plot) => plot.id)),
          ),
        ],
        advisors: advisors.map((advisor): AdvisorSummary => ({
          userId: advisor.userId,
          name: advisor.name,
        })),
      })),
    );
  }

  getByAdvisor(userId: number) {
    return this.assignments.getByAdvisor(userId).pipe(map((items) => items.map(toResponsibility)));
  }

  getByPlot(plotId: number) {
    return this.assignments
      .getByPlot(plotId)
      .pipe(map((item) => (item ? toResponsibility(item) : null)));
  }
}

function toResponsibility(item: PlotResponsibility): PlotResponsibility {
  return {
    plotId: item.plotId,
    producerUserId: item.producerUserId,
    advisorUserId: item.advisorUserId,
    status: item.status,
  };
}
