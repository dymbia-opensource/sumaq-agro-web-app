import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PlanAssembler } from '../assemblers/plan.assembler';
import { PlanResource } from '../responses/plan.response';

export class PlansApiEndpoint {
  private readonly url =
    environment.platformProviderApiBaseUrl + environment.platformProviderPlansEndpointPath;
  private readonly assembler = new PlanAssembler();

  constructor(private readonly http: HttpClient) {}

  getAll() {
    return this.http
      .get<PlanResource[]>(this.url)
      .pipe(map((resources) => resources.map(this.assembler.toEntityFromResource)));
  }
}
