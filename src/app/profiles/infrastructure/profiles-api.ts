import { CooperativeMemberDetails } from './responses/cooperative-member.response';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { CooperativeMember } from '../domain/model/entities/cooperative-member.entity';
import { Cooperative } from '../domain/model/entities/cooperative.entity';
import { FarmerProfile } from '../domain/model/entities/farmer-profile.entity';
import { PlotAdvisorAssignment } from '../domain/model/entities/plot-advisor-assignment';
import { CooperativeMembersApiEndpoint } from './endpoints/cooperative-members.endpoint';
import { PlotAdvisorAssignmentsApiEndpoint } from './endpoints/plot-advisor-assignments.endpoint';
import { CooperativesApiEndpoint } from './endpoints/cooperatives.endpoint';
import { FarmerProfilesApiEndpoint } from './endpoints/farmer-profiles.endpoint';

/** Facade that exposes only the Profile data required by its application layer. */
@Injectable({ providedIn: 'root' })
export class ProfilesApi extends BaseApi {
  private readonly farmerProfilesEndpoint: FarmerProfilesApiEndpoint;
  private readonly cooperativesEndpoint: CooperativesApiEndpoint;
  private readonly cooperativeMembersEndpoint: CooperativeMembersApiEndpoint;
  private readonly plotAdvisorAssignmentsEndpoint: PlotAdvisorAssignmentsApiEndpoint;
  /** Cooperative of each director, shared by every view and store that asks for it. */
  private readonly cooperativeByDirector = new Map<number, Observable<Cooperative | null>>();

  constructor() {
    super();
    const http = inject(HttpClient);
    this.farmerProfilesEndpoint = new FarmerProfilesApiEndpoint(http);
    this.cooperativesEndpoint = new CooperativesApiEndpoint(http);
    this.cooperativeMembersEndpoint = new CooperativeMembersApiEndpoint(http);
    this.plotAdvisorAssignmentsEndpoint = new PlotAdvisorAssignmentsApiEndpoint(http);
  }

  getFarmerProfile(userId: number): Observable<FarmerProfile> {
    return this.farmerProfilesEndpoint.getByUser(userId);
  }

  updateFarmerProfile(profile: FarmerProfile): Observable<FarmerProfile> {
    return this.farmerProfilesEndpoint.update(profile);
  }

  /**
   * Finds the cooperative of a director. The answer is shared, so the pages
   * and stores that need it at the same time make a single request; it is
   * forgotten when the cooperative is registered or edited, or when it fails.
   * @param userId - Account of the director.
   */
  getCooperativeByDirector(userId: number): Observable<Cooperative | null> {
    let request = this.cooperativeByDirector.get(userId);
    if (!request) {
      request = this.cooperativesEndpoint.getByDirector(userId).pipe(
        catchError((error: unknown) => {
          this.cooperativeByDirector.delete(userId);
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.cooperativeByDirector.set(userId, request);
    }
    return request;
  }

  registerCooperative(
    directorUserId: number,
    legalName: string,
    ruc: string,
    region: string,
  ): Observable<unknown> {
    return this.cooperativesEndpoint
      .register(directorUserId, legalName, ruc, region)
      .pipe(tap(() => this.cooperativeByDirector.delete(directorUserId)));
  }

  updateCooperative(cooperative: Cooperative): Observable<Cooperative> {
    return this.cooperativesEndpoint
      .update(cooperative, cooperative.id)
      .pipe(tap(() => this.cooperativeByDirector.delete(cooperative.directorUserId)));
  }

  addCooperativeMember(
    cooperativeId: number,
    member: CooperativeMemberDetails,
  ): Observable<CooperativeMember> {
    return this.cooperativeMembersEndpoint.add(cooperativeId, member);
  }

  getCooperativeMembers(cooperativeId: number): Observable<CooperativeMember[]> {
    return this.cooperativeMembersEndpoint.getByCooperative(cooperativeId);
  }

  /**
   * Finds the cooperative memberships of an account independently of member IDs.
   * @param userId - Current account identifier; IAM will supply it in production.
   * @returns Membership read models owned by Profiles.
   */
  getMembershipsByUser(userId: number): Observable<CooperativeMember[]> {
    return this.cooperativeMembersEndpoint.getByUser(userId);
  }

  inviteAgronomist(cooperativeId: number, email: string): Observable<unknown> {
    return this.cooperativesEndpoint.inviteAgronomist(cooperativeId, email);
  }

  getAssignmentsByCooperative(cooperativeId: number): Observable<PlotAdvisorAssignment[]> {
    return this.plotAdvisorAssignmentsEndpoint.getByCooperative(cooperativeId);
  }

  getAssignmentsByProducer(userId: number): Observable<PlotAdvisorAssignment[]> {
    return this.plotAdvisorAssignmentsEndpoint.getByProducer(userId);
  }

  getAssignmentsByAdvisor(userId: number): Observable<PlotAdvisorAssignment[]> {
    return this.plotAdvisorAssignmentsEndpoint.getByAdvisor(userId);
  }

  getAssignmentByPlot(plotId: number): Observable<PlotAdvisorAssignment | null> {
    return this.plotAdvisorAssignmentsEndpoint.getByPlot(plotId);
  }

  assign(
    cooperativeId: number,
    plotId: number,
    advisorUserId: number,
  ): Observable<PlotAdvisorAssignment> {
    return this.plotAdvisorAssignmentsEndpoint.assign(cooperativeId, plotId, advisorUserId);
  }

  reassign(assignmentId: number, advisorUserId: number): Observable<PlotAdvisorAssignment> {
    return this.plotAdvisorAssignmentsEndpoint.reassign(assignmentId, advisorUserId);
  }
}
