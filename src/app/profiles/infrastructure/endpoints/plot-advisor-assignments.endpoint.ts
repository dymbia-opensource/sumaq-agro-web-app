import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PlotAdvisorAssignment } from '../../domain/model/entities/plot-advisor-assignment';
import { PlotAdvisorAssignmentAssembler } from '../assemblers/plot-advisor-assignment.assembler';
import { PlotAdvisorAssignmentResource } from '../responses/plot-advisor-assignment.response';

/**
 * HTTP endpoint for the supervision of plots (`/agronomist-assignments`).
 *
 * @remarks
 * The API filters by query parameters here, which is the shape its controller
 * accepts: the cooperative, the producer, the agronomist or one plot.
 */
export class PlotAdvisorAssignmentsApiEndpoint {
  private readonly url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderAgronomistAssignmentsEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** Loads the plots a producer has under supervision. */
  getByProducer(userId: number): Observable<PlotAdvisorAssignment[]> {
    return this.query(new HttpParams().set('producerUserId', userId));
  }

  /** Loads the plots one agronomist is responsible for. */
  getByAdvisor(userId: number): Observable<PlotAdvisorAssignment[]> {
    return this.query(new HttpParams().set('agronomistUserId', userId));
  }

  /** Loads the single record of one plot, or nothing when it has none. */
  getByPlot(plotId: number): Observable<PlotAdvisorAssignment | null> {
    return this.query(new HttpParams().set('plotId', plotId)).pipe(
      map((items) => {
        if (items.length > 1) throw new Error('profiles.advisory.errors.conflict');

        return items[0] ?? null;
      }),
    );
  }

  /** Creates the record of a plot, or replaces the one it already has. */
  save(record: PlotAdvisorAssignment, existing: boolean): Observable<PlotAdvisorAssignment> {
    const resource = PlotAdvisorAssignmentAssembler.toResource(record);
    const saved = existing
      ? this.http.put<PlotAdvisorAssignmentResource>(`${this.url}/${record.id}`, resource)
      : this.http.post<PlotAdvisorAssignmentResource>(this.url, resource);

    return saved.pipe(map(PlotAdvisorAssignmentAssembler.toEntity));
  }

  private query(params: HttpParams): Observable<PlotAdvisorAssignment[]> {
    return this.http
      .get<PlotAdvisorAssignmentResource[]>(this.url, { params })
      .pipe(map((items) => items.map(PlotAdvisorAssignmentAssembler.toEntity)));
  }
}
