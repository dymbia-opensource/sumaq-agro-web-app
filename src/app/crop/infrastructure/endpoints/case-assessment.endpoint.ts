import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CaseAssessment, CaseAssessmentData } from '../../domain/model/entities/case-assessment';

/** HTTP endpoint for the immutable evaluations of a case (`/case-assessments`). */
export class CaseAssessmentsApiEndpoint {
  private readonly url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderCaseAssessmentsEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** Loads the validated evaluations of one incident. */
  getByReport(reportId: number): Observable<CaseAssessment[]> {
    return this.http
      .get<CaseAssessmentData[]>(this.url, {
        params: new HttpParams().set('reportId', reportId),
      })
      .pipe(map((items) => items.map((item) => new CaseAssessment(item))));
  }

  /** Records an evaluation, keeping the client ID that reconciles a retry. */
  record(data: CaseAssessmentData): Observable<CaseAssessment> {
    return this.http
      .post<CaseAssessmentData>(this.url, new CaseAssessment(data).data)
      .pipe(map((item) => new CaseAssessment(item)));
  }
}
