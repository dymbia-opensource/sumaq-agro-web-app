import { printCertificate } from './certificate-print';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { CertificationStore } from '../../../application/certification.store';
import { QualityCertificate } from '../../../domain/model/entities/quality-certificate.entity';
import {
  Breadcrumb,
  PageHeader,
} from '../../../../shared/presentation/components/page-header/page-header';

/**
 * Certificates of the producer: what he shows a buyer to back the sale.
 *
 * @remarks
 * It only reads. Issuing belongs to the cooperative that receives the harvest,
 * so this screen has no evaluation form.
 */
@Component({
  selector: 'app-farmer-certificates',
  imports: [DatePipe, MatIconModule, TranslatePipe, PageHeader],
  templateUrl: './farmer-certificates.html',
  styleUrl: './farmer-certificates.css',
})
export class FarmerCertificates {
  protected readonly store = inject(CertificationStore);

  protected readonly breadcrumbs: Breadcrumb[] = [{ label: 'certification.page-title' }];

  /** Certificate together with the batch it was issued for. */
  protected readonly certificates = computed(() =>
    this.store.activeCertificates().flatMap((certificate) => {
      const batch = this.store
        .batches()
        .find((item) => item.id === certificate.data.harvestBatchId);

      return batch ? [{ certificate, batch }] : [];
    }),
  );

  /** Certificate whose QR code is on screen, so only one opens at a time. */
  protected readonly visibleQr = signal<string | number | null>(null);

  /** Public page a buyer reaches by scanning the code. */
  protected verificationUrl(certificate: QualityCertificate): string {
    return `${window.location.origin}/verify/${encodeURIComponent(certificate.data.verificationToken)}`;
  }

  protected qrUrl(certificate: QualityCertificate): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(this.verificationUrl(certificate))}`;
  }

  protected toggleQr(certificateId: string | number): void {
    this.visibleQr.update((current) => (current === certificateId ? null : certificateId));
  }

  protected print(source: HTMLElement, certificate: QualityCertificate): void {
    void printCertificate(source, {
      url: this.verificationUrl(certificate),
      qr: this.qrUrl(certificate),
    });
  }
}
