import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import {
  BatchEntry,
  HarvestBatchResource,
  PublicTraceabilityResource,
  QualityCertificateResource,
  RegisterBatchRequest,
} from "./responses/certification-workspace.response";

@Injectable({ providedIn: "root" })
export class CertificationApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.platformProviderApiBaseUrl.replace(
    /\/+$/,
    "",
  );
  private readonly batches = this.base + "/harvest-batches";
  private readonly certificates = this.base + "/quality-certificates";

  listBatches(cooperativeId: number) {
    return this.http.get<BatchEntry[]>(this.batches, {
      params: { cooperativeId },
    });
  }

  register(body: RegisterBatchRequest) {
    return this.http.post<HarvestBatchResource>(this.batches, body);
  }

  batch(id: number) {
    return this.http.get<HarvestBatchResource>(this.batches + "/" + id);
  }

  weigh(id: number, body: { grossWeightKg: number; tareKg: number }) {
    return this.http.post<HarvestBatchResource>(
      this.batches + "/" + id + "/weight",
      body,
    );
  }

  sample(
    id: number,
    body: { sampleIdentifier: string; sampleWeightKg: number },
  ) {
    return this.http.post<HarvestBatchResource>(
      this.batches + "/" + id + "/sample",
      body,
    );
  }

  gradePotato(
    id: number,
    body: {
      firstPercentage: number;
      secondPercentage: number;
      thirdPercentage: number;
      pestDamagePercentage: number;
    },
  ) {
    return this.http.post<HarvestBatchResource>(
      this.batches + "/" + id + "/potato-calibers",
      body,
    );
  }

  cupCoffee(
    id: number,
    body: {
      aroma: number;
      flavor: number;
      acidity: number;
      body: number;
      totalScore: number;
      fermentDefect: boolean;
    },
  ) {
    return this.http.post<HarvestBatchResource>(
      this.batches + "/" + id + "/coffee-cupping",
      body,
    );
  }

  issue(body: {
    certificateNumber: string;
    harvestBatchId: number;
    issuedByUserId: number;
  }) {
    return this.http.post<QualityCertificateResource>(this.certificates, body);
  }

  certificate(certificateNumber: string) {
    return this.http.get<QualityCertificateResource>(this.certificates, {
      params: { certificateNumber },
    });
  }

  revoke(id: number) {
    return this.http.post<QualityCertificateResource>(
      this.certificates + "/" + id + "/revocation",
      null,
    );
  }

  document(certificateNumber: string) {
    return this.http.get(this.certificates + "/document", {
      params: { certificateNumber },
      responseType: "blob",
    });
  }

  verify(number: string, hash: string) {
    return this.http.get<PublicTraceabilityResource>(
      this.base + "/public/traceability",
      {
        params: { number, hash },
      },
    );
  }
}
