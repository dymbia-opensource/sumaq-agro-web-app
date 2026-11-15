import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { HarvestBatch } from '../../../domain/model/entities/harvest-batch.entity';
import { QualityCertificate } from '../../../domain/model/entities/quality-certificate.entity';
import { CertificationApi } from '../../../infrastructure/certification-api';

@Component({
  selector: 'app-public-traceability',
  imports: [DatePipe, DecimalPipe, TranslatePipe],
  template: `
    <article class="trace-card">
      <p class="eyebrow">SumaqAgro · {{ 'certification.trace.public-verification' | translate }}</p>
      @if (loading()) {
        <h1>{{ 'certification.trace.verifying' | translate }}</h1>
      } @else if (error()) {
        <h1>{{ 'certification.trace.verification-failed' | translate }}</h1>
        <p>{{ error() | translate }}</p>
      } @else if (certificate(); as certificate) {
        @if (certificate.data.status === 'ACTIVE') {
          @if (batch(); as batch) {
            <h1>{{ 'certification.trace.registered' | translate }}</h1>
            <p class="status">
              {{ 'certification.trace.active' | translate }} ·
              {{ certificate.data.certificateNumber }}
            </p>
            @if (certificate.data.verificationToken.startsWith('demo-')) {
              <p>{{ 'certification.trace.demo-data' | translate }}</p>
            }
            <dl>
              <dt>{{ 'certification.trace.producer' | translate }}</dt>
              <dd>{{ batch.data.memberName }}</dd>
              <dt>{{ 'certification.trace.batch' | translate }}</dt>
              <dd>{{ batch.data.code }}</dd>
              <dt>{{ 'certification.trace.product' | translate }}</dt>
              <dd>{{ batch.data.variety }}</dd>
              <dt>{{ 'certification.trace.origin' | translate }}</dt>
              <dd>{{ batch.data.plotName }}, {{ batch.data.plotRegion }}</dd>
              <dt>{{ 'certification.trace.coordinates' | translate }}</dt>
              <dd>{{ batch.data.coordinates }}</dd>
              <dt>{{ 'certification.trace.volume' | translate }}</dt>
              <dd>{{ batch.netKg | number: '1.0-2' }} kg</dd>
              <dt>{{ 'certification.trace.quality' | translate }}</dt>
              <dd>
                {{ 'certification.quality-category.' + batch.data.qualityCategory | translate }}
              </dd>
              <dt>{{ 'certification.trace.issued' | translate }}</dt>
              <dd>{{ certificate.data.issuedAt | date: 'longDate' }}</dd>
              <dt>{{ 'certification.trace.issuer' | translate }}</dt>
              <dd>{{ certificate.data.issuedByName }}</dd>
              @if (!certificate.data.verificationToken.startsWith('demo-')) {
                <dt>{{ 'certification.trace.registered-hash' | translate }}</dt>
                <dd class="hash">{{ certificate.data.sha256Hash }}</dd>
              }
            </dl>
          }
        } @else {
          <h1>{{ 'certification.trace.revoked' | translate }}</h1>
          <p>
            {{ 'certification.trace.not-valid' | translate }} {{ certificate.data.revokedReason }}
          </p>
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
/** Consulta por token el certificado que abre el QR y muestra su trazabilidad. */
export class PublicTraceability {
  private readonly api = inject(CertificationApi);
  private readonly route = inject(ActivatedRoute);
  readonly certificate = signal<QualityCertificate | null>(null);
  readonly batch = signal<HarvestBatch | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    // Cada token de la URL inicia una nueva consulta pública.
    this.route.paramMap
      .pipe(switchMap((params) => this.api.getPublicTraceability(params.get('token') ?? '')))
      .subscribe({
        next: (record) => {
          if (!record) {
            this.error.set('certification.trace.unknown-code');
            this.loading.set(false);
            return;
          }
          this.certificate.set(record.certificate);
          this.batch.set(record.batch);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('certification.trace.api-unavailable');
          this.loading.set(false);
        },
      });
  }
}
