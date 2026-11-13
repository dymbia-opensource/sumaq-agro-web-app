import { CooperativeMemberDetails } from './responses/cooperative-member.response';
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { CooperativeMember, MemberPlot } from '../domain/model/entities/cooperative-member.entity';
import { Cooperative } from '../domain/model/entities/cooperative.entity';
import { CooperativeDashboard } from '../domain/model/entities/cooperative-dashboard.entity';
import { FarmerProfile } from '../domain/model/entities/farmer-profile.entity';
import { TechnicalAdvisor } from '../domain/model/entities/technical-advisor.entity';
import { CooperativeMembersApiEndpoint } from './endpoints/cooperative-members.endpoint';
import { CooperativeDashboardApiEndpoint } from './endpoints/cooperative-dashboard.endpoint';
import { CooperativesApiEndpoint } from './endpoints/cooperatives.endpoint';
import { FarmerProfilesApiEndpoint } from './endpoints/farmer-profiles.endpoint';
import { TechnicalAdvisorsApiEndpoint } from './endpoints/technical-advisors.endpoint';

/** Facade that exposes only the Profile data required by its application layer. */
@Service()
export class ProfilesApi extends BaseApi {
  private readonly farmerProfilesEndpoint: FarmerProfilesApiEndpoint;
  private readonly cooperativesEndpoint: CooperativesApiEndpoint;
  private readonly cooperativeMembersEndpoint: CooperativeMembersApiEndpoint;
  private readonly cooperativeDashboardEndpoint: CooperativeDashboardApiEndpoint;
  private readonly technicalAdvisorsEndpoint: TechnicalAdvisorsApiEndpoint;

  constructor() {
    super();
    const http = inject(HttpClient);
    this.farmerProfilesEndpoint = new FarmerProfilesApiEndpoint(http);
    this.cooperativesEndpoint = new CooperativesApiEndpoint(http);
    this.cooperativeMembersEndpoint = new CooperativeMembersApiEndpoint(http);
    this.cooperativeDashboardEndpoint = new CooperativeDashboardApiEndpoint(http);
    this.technicalAdvisorsEndpoint = new TechnicalAdvisorsApiEndpoint(http);
  }

  getFarmerProfile(userId: number): Observable<FarmerProfile> {
    return this.farmerProfilesEndpoint.getByUser(userId);
  }

  updateFarmerProfile(profile: FarmerProfile): Observable<FarmerProfile> {
    return this.farmerProfilesEndpoint.update(profile, profile.id);
  }

  getCooperativeByDirector(userId: number): Observable<Cooperative | null> {
    return this.cooperativesEndpoint.getByDirector(userId);
  }

  registerCooperative(directorUserId: number, legalName: string, ruc: string, region: string): Observable<unknown> {
    return this.cooperativesEndpoint.register(directorUserId, legalName, ruc, region);
  }

  updateCooperative(cooperative: Cooperative): Observable<Cooperative> {
    return this.cooperativesEndpoint.update(cooperative, cooperative.id);
  }

  addCooperativeMember(cooperativeId: number, member: CooperativeMemberDetails): Observable<CooperativeMember> {
    return this.cooperativeMembersEndpoint.add(cooperativeId, member);
  }

  updateCooperativeMember(id: number | string, details: CooperativeMemberDetails): Observable<CooperativeMember> {
    return this.cooperativeMembersEndpoint.updateDetails(id, details);
  }

  linkMemberPlot(member: CooperativeMember, plot: MemberPlot): Observable<CooperativeMember> {
    return this.cooperativeMembersEndpoint.linkPlot(member, plot);
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

  getInstitutionalDashboard(directorUserId: number): Observable<CooperativeDashboard | null> {
    return this.cooperativeDashboardEndpoint.getByDirector(directorUserId);
  }

  getAdvisorByUser(userId: number): Observable<TechnicalAdvisor | null> {
    return this.technicalAdvisorsEndpoint.getByUser(userId);
  }

  getTechnicalAdvisors(cooperativeId: number): Observable<TechnicalAdvisor[]> {
    return this.technicalAdvisorsEndpoint.getByCooperative(cooperativeId);
  }

  /** Lists demo professionals with a linked account, without requiring cooperative membership. */
  getAvailableAdvisors(): Observable<TechnicalAdvisor[]> {
    return this.technicalAdvisorsEndpoint
      .getAll()
      .pipe(
        map((items) => [
          ...new Map(
            items
              .filter((item) => Number.isSafeInteger(item.userId) && item.userId! > 0)
              .map((item) => [item.userId!, item]),
          ).values(),
        ]),
      );
  }

  createTechnicalAdvisor(advisor: TechnicalAdvisor): Observable<TechnicalAdvisor> {
    return this.technicalAdvisorsEndpoint.create(advisor);
  }

  updateTechnicalAdvisor(advisor: TechnicalAdvisor): Observable<TechnicalAdvisor> {
    return this.technicalAdvisorsEndpoint.update(advisor, advisor.id);
  }

  deleteTechnicalAdvisor(id: number): Observable<void> {
    return this.technicalAdvisorsEndpoint.delete(id);
  }
}
