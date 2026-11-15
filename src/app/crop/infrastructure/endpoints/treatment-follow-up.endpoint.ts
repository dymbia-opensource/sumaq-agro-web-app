import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TreatmentFollowUp,
  TreatmentFollowUpData,
} from '../../domain/model/entities/treatment-follow-up';

/** HTTP endpoint for the evidence the producer records (`/treatment-follow-ups`). */
export class TreatmentFollowUpsApiEndpoint {
  private readonly url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderTreatmentFollowUpsEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** Loads the evidence of one report. */
  getByReport(reportId: number): Observable<TreatmentFollowUp[]> {
    return this.http
      .get<TreatmentFollowUpData[]>(this.url, {
        params: new HttpParams().set('reportId', reportId),
      })
      .pipe(map((items) => items.map((item) => new TreatmentFollowUp(item))));
  }

  /** Records evidence, keeping the client ID that reconciles a retry. */
  record(data: TreatmentFollowUpData): Observable<TreatmentFollowUp> {
    return this.http
      .post<TreatmentFollowUpData>(this.url, new TreatmentFollowUp(data).data)
      .pipe(map((item) => new TreatmentFollowUp(item)));
  }
}
