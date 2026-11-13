import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { HarvestCertificationStore } from '../../../application/harvest-certification.store';
import { HarvestBatch, HarvestBatchProps, HarvestCropType, QualityCategory, } from '../../../domain/model/entities/harvest-batch.entity';
import { QualityCertificate } from '../../../domain/model/entities/quality-certificate.entity';
import { HarvestBatchRegistrationView } from '../harvest-batch-registration-view/harvest-batch-registration-view';
import { HarvestGradingSheetView } from '../harvest-grading-sheet-view/harvest-grading-sheet-view';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';

@Component({
  selector: 'app-harvest-certificates-view',
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    HarvestBatchRegistrationView,
    HarvestGradingSheetView,
    PageHeader,
  ],
  templateUrl: './harvest-certificates-view.html',
  styleUrl: './harvest-certificates-view.css',
})
/**
 * Presents scoped certificates and a director-only evaluation workflow.
 * @remarks
 * Profiles resolves the account's membership. The view never equates account and
 * member IDs; issuing identity comes from the store's resolved session participant.
 */
export class HarvestCertificatesView {
  readonly store = inject(HarvestCertificationStore);
  private readonly session = inject(IamStore);
  readonly isFarmer = computed(() => this.session.activeUser()?.experience === 'FARMER');
  readonly farmerCertificates = computed(() => {
    return this.store.activeCertificates().flatMap((certificate) => {
      const batch = this.store
        .batches()
        .find((item) => item.id === certificate.data.harvestBatchId);
      return batch ? [{ certificate, batch }] : [];
    });
  });
  readonly visibleQr = signal<string | number | null>(null);
  readonly members = this.store.members;
  readonly search = signal('');
  readonly cropFilter = signal('ALL');
  readonly qualityFilter = signal('ALL');
  readonly page = signal(1);
  readonly pageSize = 8;
  readonly dialog = signal<'closed' | 'form' | 'preview' | 'issued'>('closed');
  readonly selectedBatch = signal<HarvestBatch | null>(null);
  readonly selectedCertificate = signal<QualityCertificate | null>(null);
  readonly formError = signal('');
  readonly formErrorParams = signal<Record<string, number>>({});
  readonly notifyMember = signal(false);
  readonly busy = signal(false);
  readonly draftToken = signal<string | null>(null);
  readonly draftHash = signal<string | null>(null);
  readonly draftIssuedAt = signal<string | null>(null);

  form = this.emptyForm();

  /** Aplica búsqueda y filtros sobre los certificados asociados a sus lotes. */
  readonly rows = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    return this.store
      .certificates()
      .flatMap((certificate) => {
        const batch = this.store
          .batches()
          .find((item) => item.id === certificate.data.harvestBatchId);
        return batch ? [{ certificate, batch }] : [];
      })
      .filter(
        ({ certificate, batch }) =>
          (!term ||
            `${batch.data.code} ${batch.data.memberName} ${certificate.data.certificateNumber}`
              .toLocaleLowerCase()
              .includes(term)) &&
          (this.cropFilter() === 'ALL' || batch.data.cropType === this.cropFilter()) &&
          (this.qualityFilter() === 'ALL' || batch.data.qualityCategory === this.qualityFilter()),
      );
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.rows().length / this.pageSize)));
  readonly visibleRows = computed(() =>
    this.rows().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize),
  );
  get plotsForMember() {
    return this.members().find((member) => member.id === this.form.memberId)?.plots ?? [];
  }
  get selectedCrop(): HarvestCropType {
    return (
      this.plotsForMember.find((plot) => plot.id === this.form.plotId)?.cropType ?? 'ANDEAN_POTATO'
    );
  }
  get netKg(): number {
    return Math.max(0, this.form.grossKg - this.form.tareKg);
  }
  get gradingTotal(): number {
    return this.form.firstPercentage + this.form.secondPercentage + this.form.thirdPercentage;
  }
  /** El QR apunta a la ruta pública usando el token del certificado. */
  readonly previewUrl = computed(() => {
    const token = this.selectedCertificate()?.data.verificationToken ?? this.draftToken();
    return token ? `${window.location.origin}/verify/${encodeURIComponent(token)}` : '';
  });
  readonly qrImageUrl = computed(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(this.previewUrl())}`,
  );

  verificationUrl(certificate: QualityCertificate): string {
    return `${window.location.origin}/verify/${encodeURIComponent(certificate.data.verificationToken)}`;
  }

  farmerQrUrl(certificate: QualityCertificate): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(this.verificationUrl(certificate))}`;
  }

  toggleFarmerQr(certificateId: string | number): void {
    this.visibleQr.update((current) => (current === certificateId ? null : certificateId));
  }

  constructor() {
    effect(() => {
      if (this.store.error()) this.busy.set(false);
    });
    effect(() => {
      this.session.activeUser();
      this.store.cooperativeId();
      untracked(() => {
        this.close();
        this.selectedBatch.set(null);
        this.selectedCertificate.set(null);
        this.draftToken.set(null);
        this.draftHash.set(null);
        this.draftIssuedAt.set(null);
        this.visibleQr.set(null);
        this.busy.set(false);
        this.formError.set('');
        this.search.set('');
        this.cropFilter.set('ALL');
        this.qualityFilter.set('ALL');
        this.page.set(1);
        this.form = this.emptyForm();
      });
    });
  }

  get certificationRate(): number {
    const total = this.store.batches().length;
    return total ? Math.round((this.store.activeCertificates().length / total) * 100) : 0;
  }

  get potatoFirstRate(): number {
    const graded = this.store.batches().filter((batch) => batch.data.potatoGrading);
    return graded.length
      ? Math.round(
          graded.reduce((total, batch) => total + batch.data.potatoGrading!.firstPercentage, 0) /
            graded.length,
        )
      : 0;
  }

  get specialtyCoffeeCount(): number {
    return this.store.batches().filter((batch) => batch.data.qualityCategory === 'SPECIALTY_COFFEE')
      .length;
  }

  /** Prepara un formulario limpio para evaluar otro lote. */
  openNew(): void {
    if (!this.store.canIssue() || this.store.loading()) return;
    this.form = this.emptyForm();
    this.form.memberId = (this.members()[0]?.id as number | undefined) ?? 0;
    this.changeMember();
    this.formError.set('');
    this.busy.set(false);
    this.selectedBatch.set(null);
    this.selectedCertificate.set(null);
    this.draftToken.set(null);
    this.draftHash.set(null);
    this.draftIssuedAt.set(null);
    this.dialog.set('form');
  }

  close(): void {
    this.dialog.set('closed');
  }

  changeMember(): void {
    this.form.plotId = this.plotsForMember[0]?.id ?? 0;
    this.formError.set('');
  }

  loadExample(): void {
    if (this.selectedCrop === 'SPECIALTY_COFFEE') {
      Object.assign(this.form, { grossKg: 2600, tareKg: 100, sampleKg: 1, scaScore: 86.5 });
    } else {
      Object.assign(this.form, {
        grossKg: 8568,
        tareKg: 168,
        sampleKg: 10,
        firstPercentage: 72,
        secondPercentage: 20,
        thirdPercentage: 8,
        weevilDamagePercentage: 1.2,
      });
    }
    this.formError.set('');
  }

  selectPage(page: number): void {
    this.page.set(Math.max(1, Math.min(this.pageCount(), page)));
  }

  showCertificate(certificate: QualityCertificate): void {
    this.draftToken.set(null);
    this.draftHash.set(null);
    this.draftIssuedAt.set(null);
    this.selectedCertificate.set(certificate);
    this.selectedBatch.set(
      this.store.batches().find((batch) => batch.id === certificate.data.harvestBatchId) ?? null,
    );
    this.dialog.set('issued');
  }

  /** Valida el formulario y prepara el lote y su huella para la vista previa. */
  async preview(): Promise<void> {
    if (!this.store.canIssue() || this.store.loading()) return;
    const participant = this.session.activeUser();
    const cooperativeId = this.store.cooperativeId();
    this.formError.set('');
    const member = this.members().find((item) => item.id === this.form.memberId);
    const plot = member?.plots.find((item) => item.id === this.form.plotId);
    if (!member || !plot || member.cooperativeId !== cooperativeId) {
      this.formError.set('harvest-certification.errors.select-member-plot');
      return;
    }
    if (this.form.grossKg <= 0 || this.form.tareKg < 0 || this.netKg <= 0) {
      this.formErrorParams.set({ gross: this.form.grossKg, tare: this.form.tareKg });
      this.formError.set('harvest-certification.errors.gross-weight');
      return;
    }
    if (this.form.sampleKg <= 0 || this.form.sampleKg > this.netKg) {
      this.formErrorParams.set({ net: this.netKg });
      this.formError.set('harvest-certification.errors.sample-weight');
      return;
    }
    if (
      plot.cropType === 'ANDEAN_POTATO' &&
      (Math.abs(this.gradingTotal - 100) > 0.01 ||
        this.form.weevilDamagePercentage < 0 ||
        this.form.weevilDamagePercentage > 100)
    ) {
      this.formError.set('harvest-certification.errors.potato-grading');
      return;
    }
    if (
      plot.cropType === 'SPECIALTY_COFFEE' &&
      (this.form.scaScore < 0 || this.form.scaScore > 100)
    ) {
      this.formError.set('harvest-certification.errors.sca-score');
      return;
    }
    const code = `BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const category: QualityCategory =
      plot.cropType === 'SPECIALTY_COFFEE'
        ? this.form.scaScore >= 80
          ? 'SPECIALTY_COFFEE'
          : 'COMMERCIAL_COFFEE'
        : this.form.firstPercentage >= 65 && this.form.weevilDamagePercentage <= 15
          ? 'PREMIUM_GOLD'
          : this.form.firstPercentage >= 45
            ? 'STANDARD'
            : 'B_GRADE_REQUIRES_SORTING';
    const batch: HarvestBatchProps = {
      id: 0,
      code,
      cooperativeId: cooperativeId!,
      memberId: member.id as number,
      memberName: member.name,
      plotId: plot.id,
      plotName: plot.name,
      plotRegion: plot.region,
      coordinates: plot.coordinates,
      campaignId: plot.campaignId,
      cropType: plot.cropType,
      variety: plot.variety,
      collectedAt: new Date().toISOString().slice(0, 10),
      grossKg: this.form.grossKg,
      tareKg: this.form.tareKg,
      sampleKg: this.form.sampleKg,
      potatoGrading:
        plot.cropType === 'ANDEAN_POTATO'
          ? {
              firstPercentage: this.form.firstPercentage,
              secondPercentage: this.form.secondPercentage,
              thirdPercentage: this.form.thirdPercentage,
              weevilDamagePercentage: this.form.weevilDamagePercentage,
            }
          : null,
      coffeeCupping:
        plot.cropType === 'SPECIALTY_COFFEE'
          ? {
              aroma: 0,
              flavor: 0,
              acidity: 0,
              body: 0,
              totalScore: this.form.scaScore,
            }
          : null,
      qualityCategory: category,
      status: 'GRADED',
    };
    const { id: _previewId, ...newBatch } = batch;
    const issuedAt = new Date().toISOString();
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify({ batch: newBatch, issuedAt })),
    );
    // Hashing is asynchronous; discard the draft if its participant changed.
    if (
      participant !== this.session.activeUser() ||
      cooperativeId !== this.store.cooperativeId() ||
      !this.store.canIssue()
    )
      return;
    this.draftHash.set(
      Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(''),
    );
    this.draftToken.set(crypto.randomUUID());
    this.draftIssuedAt.set(issuedAt);
    this.selectedBatch.set(new HarvestBatch(batch));
    this.dialog.set('preview');
  }

  /** Registra primero el lote y luego solicita la emisión de su certificado. */
  async issue(): Promise<void> {
    const issuer = this.store.issuer();
    const batch = this.selectedBatch();
    const token = this.draftToken();
    const hash = this.draftHash();
    const issuedAt = this.draftIssuedAt();
    if (
      !issuer ||
      !batch ||
      !token ||
      !hash ||
      !issuedAt ||
      this.busy() ||
      this.store.loading() ||
      batch.data.cooperativeId !== this.store.cooperativeId()
    )
      return;
    this.busy.set(true);
    const { id: _previewId, ...newBatch } = batch.data;
    this.store.register(newBatch, (saved) => {
      this.selectedBatch.set(saved);
      this.store.certify(
        saved,
        {
          harvestBatchId: saved.id as number,
          certificateNumber: `CERT-${saved.data.code}`,
          sha256Hash: hash,
          verificationToken: token,
          issuedByUserId: issuer.id,
          issuedByName: issuer.displayName,
          issuedAt,
          status: 'ACTIVE',
          revokedReason: null,
        },
        () => {
          this.selectedCertificate.set(
            this.store.certificates().find((item) => item.data.harvestBatchId === saved.id) ?? null,
          );
          this.dialog.set('issued');
          this.busy.set(false);
        },
      );
    });
  }

  print(): void {
    window.print();
  }

  private emptyForm() {
    return {
      memberId: 0,
      plotId: 0,
      grossKg: 0,
      tareKg: 0,
      sampleKg: 1,
      firstPercentage: 72,
      secondPercentage: 20,
      thirdPercentage: 8,
      weevilDamagePercentage: 1.2,
      scaScore: 85,
    };
  }
}
