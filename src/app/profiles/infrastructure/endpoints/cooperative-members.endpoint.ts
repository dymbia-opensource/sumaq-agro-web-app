import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { CooperativeMember } from '../../domain/model/entities/cooperative-member.entity';
import { CooperativeMemberAssembler } from '../assemblers/cooperative-member.assembler';
import {
  CooperativeMemberResource,
  CooperativeMembersResponse,
} from '../responses/cooperative-member.response';

/** HTTP endpoint for the cooperative member directory. */
export class CooperativeMembersApiEndpoint extends BaseApiEndpoint<
  CooperativeMember,
  CooperativeMemberResource,
  CooperativeMembersResponse,
  CooperativeMemberAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCooperativeMembersEndpointPath}`,
      new CooperativeMemberAssembler(),
    );
  }

  add(cooperativeId: number, member: { fullName: string; dni: string; phone: string; community: string }): Observable<CooperativeMember> {
    return this.http.post<CooperativeMemberResource>(this.endpointUrl, {
      ...member,
      cooperativeId,
      active: true,
      plots: [],
    }).pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  getByCooperative(cooperativeId: number): Observable<CooperativeMember[]> {
    const params = new HttpParams().set('cooperativeId', cooperativeId);
    return this.http.get<CooperativeMemberResource[]>(this.endpointUrl, { params }).pipe(
      map((members) => members.map((member) => this.assembler.toEntityFromResource(member))),
      catchError(this.handleError('Failed to fetch cooperative members')),
    );
  }

  /**
   * Resolves memberships by their explicit account reference.
   * @param userId - Account identifier supplied by the current session.
   * @returns Memberships linked to that account; never matched by member ID.
   */
  getByUser(userId: number): Observable<CooperativeMember[]> {
    return this.getAllBy({ userId }, 'Failed to fetch user memberships');
  }
}
