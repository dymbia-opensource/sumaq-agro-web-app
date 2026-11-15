import { DecimalPipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { TranslatePipe } from "@ngx-translate/core";
import { catchError, map, of, startWith, switchMap } from "rxjs";
import { CertificationApi } from "../../../infrastructure/certification-api";
import { PublicTraceabilityResource } from "../../../infrastructure/responses/certification-workspace.response";

interface Verification {
  loading?: boolean;
  error?: string;
  result?: PublicTraceabilityResource;
}

@Component({
  selector: "app-public-traceability",
  imports: [DecimalPipe, TranslatePipe],
  template: `
    <article class="trace-card">
      <p class="eyebrow">
        SumaqAgro · {{ "certification.trace.public-verification" | translate }}
      </p>
      @let state = verification();
      @if (state.loading) {
        <h1>{{ "certification.trace.verifying" | translate }}</h1>
      } @else if (state.error) {
        <h1>{{ "certification.trace.verification-failed" | translate }}</h1>
        <p>{{ state.error | translate }}</p>
      } @else if (state.result; as result) {
        @if (result.status === "REVOKED") {
          <h1>{{ "certification.trace.revoked" | translate }}</h1>
          <p>{{ "certification.trace.not-valid" | translate }}</p>
        } @else if (!result.authentic) {
          <h1>{{ "certification.trace.verification-failed" | translate }}</h1>
          <p>{{ "certification.workspace.invalid-hash" | translate }}</p>
        } @else {
          <h1>{{ "certification.trace.registered" | translate }}</h1>
          <p class="status">
            {{ result.certificateNumber }} ·
            {{ "certification.trace.active" | translate }}
          </p>
          <dl>
            <dt>{{ "certification.trace.batch" | translate }}</dt>
            <dd>{{ result.batchCode }}</dd>
            <dt>{{ "certification.trace.product" | translate }}</dt>
            <dd>
              {{
                "certification.workspace.cropType." + result.cropType
                  | translate
              }}
              @if (result.seedVariety) {
                · {{ result.seedVariety }}
              }
            </dd>
            @if (result.plotName || result.region) {
              <dt>{{ "certification.trace.origin" | translate }}</dt>
              <dd>{{ result.plotName }} {{ result.region }}</dd>
            }
            <dt>{{ "certification.trace.quality" | translate }}</dt>
            <dd>
              {{ result.qualityCategory }} · {{ result.qualityScore | number }}
            </dd>
          </dl>
        }
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 760px;
        margin: 25px auto;
        padding: 12px;
      }

      .trace-card {
        background: white;
        border-radius: 18px;
        padding: clamp(20px, 4vw, 42px);
        box-shadow: 0 4px 18px #0002;
      }

      .eyebrow {
        color: #08745f;
        font-weight: 700;
      }

      h1 {
        font-size: clamp(24px, 4vw, 34px);
      }

      .status {
        display: inline-block;
        padding: 8px 12px;
        border-radius: 20px;
        background: #dbf1e3;
        color: #12603e;
        font-weight: 700;
      }

      dl {
        display: grid;
        grid-template-columns: minmax(120px, 1fr) 2fr;
        gap: 12px;
        margin-top: 25px;
      }

      dt {
        color: #5f7167;
      }

      dd {
        margin: 0;
        font-weight: 600;
      }

      .hash {
        font-size: 11px;
        overflow-wrap: anywhere;
      }

      @media (max-width: 550px) {
        dl {
          grid-template-columns: 1fr;
          gap: 3px;
        }

        dd {
          margin-bottom: 12px;
        }
      }
    `,
  ],
})
export class PublicTraceability {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CertificationApi);

  protected readonly verification = toSignal<Verification, Verification>(
    this.route.queryParamMap.pipe(
      switchMap((params) => {
        const number = params.get("number")?.trim();
        const hash = params.get("hash")?.trim();
        if (!number || !hash)
          return of<Verification>({
            error: "certification.workspace.missing-link",
          });
        if (!/^[a-f0-9]{64}$/i.test(hash)) {
          return of<Verification>({ error: 'certification.workspace.invalid-hash' });
        }
        return this.api.verify(number, hash).pipe(
          map((result): Verification => ({ result })),
          catchError((error: unknown) =>
            of<Verification>({
              error:
                error instanceof HttpErrorResponse && error.status === 404
                  ? "certification.workspace.not-found"
                  : "certification.workspace.verification-unavailable",
            }),
          ),
          startWith<Verification, [Verification]>({ loading: true }),
        );
      }),
    ),
    { initialValue: { loading: true } },
  );
}
