import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { AgronomistInvitation } from '../../domain/model/entities/agronomist-invitation.entity';
import { Cooperative } from '../../domain/model/entities/cooperative.entity';
import { MemberCandidate } from '../../domain/model/entities/member-candidate';
import { AgronomistInvitationAssembler } from '../assemblers/agronomist-invitation.assembler';
import { CooperativeAssembler } from '../assemblers/cooperative.assembler';
import { MemberCandidateAssembler } from '../assemblers/member-candidate.assembler';
import { AgronomistInvitationResource } from '../responses/agronomist-invitation.response';
import { MemberCandidateResource } from '../responses/member-candidate.response';
import { CooperativeResource, CooperativesResponse } from '../responses/cooperative.response';

/** HTTP endpoint for institutional cooperative data. */
export class CooperativesApiEndpoint extends BaseApiEndpoint<
  Cooperative,
  CooperativeResource,
  CooperativesResponse,
  CooperativeAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCooperativesEndpointPath}`,
      new CooperativeAssembler(),
    );
  }

  register(
    directorUserId: number,
    legalName: string,
    ruc: string,
    region: string,
  ): Observable<unknown> {
    return this.http.post(this.endpointUrl, {
      managerUserId: directorUserId,
      businessName: legalName,
      ruc,
      region,
    });
  }

  override update(cooperative: Cooperative, id: number | string): Observable<Cooperative> {
    const {
      id: _id,
      managerUserId: _manager,
      ...body
    } = this.assembler.toResourceFromEntity(cooperative);
    return this.http
      .put<CooperativeResource>(this.endpointUrl + '/' + id, body)
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  private readonly invitationAssembler = new AgronomistInvitationAssembler();
  private readonly candidateAssembler = new MemberCandidateAssembler();

  inviteAgronomist(cooperativeId: number, email: string): Observable<AgronomistInvitation> {
    return this.http
      .post<AgronomistInvitationResource>(this.endpointUrl + '/' + cooperativeId + '/invitations', {
        email,
      })
      .pipe(map((resource) => this.invitationAssembler.toEntityFromResource(resource)));
  }

  /** Pending and accepted invitations: the technical team of the cooperative. */
  getInvitations(cooperativeId: number): Observable<AgronomistInvitation[]> {
    return this.http
      .get<AgronomistInvitationResource[]>(this.endpointUrl + '/' + cooperativeId + '/invitations')
      .pipe(
        map((resources) =>
          resources.map((resource) => this.invitationAssembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError('Failed to fetch the technical team')),
      );
  }

  /**
   * Finds the producer account that uses an email.
   * @returns The producer, or null when no producer account uses the email.
   */
  findMemberCandidate(cooperativeId: number, email: string): Observable<MemberCandidate | null> {
    const params = new HttpParams().set('email', email);
    return this.http
      .get<MemberCandidateResource>(this.endpointUrl + '/' + cooperativeId + '/member-candidates', {
        params,
      })
      .pipe(
        map((resource) => this.candidateAssembler.toEntityFromResource(resource)),
        catchError((error: HttpErrorResponse) =>
          error.status === 404 ? of(null) : throwError(() => error),
        ),
      );
  }

  getByDirector(userId: number): Observable<Cooperative | null> {
    const params = new HttpParams().set('directorUserId', userId);
    return this.http.get<CooperativeResource[]>(this.endpointUrl, { params }).pipe(
      map((cooperatives) =>
        cooperatives[0] ? this.assembler.toEntityFromResource(cooperatives[0]) : null,
      ),
      catchError(this.handleError('Failed to fetch the cooperative')),
    );
  }
}
