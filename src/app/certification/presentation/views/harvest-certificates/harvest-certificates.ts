import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';
import { FarmingStore } from '../../../../farming/application/farming.store';
import { PlotSummary } from '../../../../farming/domain/model/entities/plot-summary';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { CertificationStore } from '../../../application/certification.store';
import { HarvestCropType } from '../../../domain/model/entities/crop-type';
import { HarvestBatch } from '../../../domain/model/entities/harvest-batch.entity';
import { QualityCertificate } from '../../../domain/model/entities/quality-certificate.entity';

/**
 * Certification workspace: the director registers the batches the members
 * deliver, weighs, samples and grades them, and issues their certificates; a
 * farmer sees the batches of their cooperatives. The view only keeps its form
 * values and sends them to the store.
 */
@Component({
  selector: 'app-harvest-certificates',
  imports: [FormsModule, DatePipe, DecimalPipe, RouterLink, TranslatePipe, MatButtonModule, MatProgressBarModule, PageHeader],
  providers: [CertificationStore],
  templateUrl: './harvest-certificates.html',
  styleUrl: './harvest-certificates.css',
})
export class HarvestCertificates {
  protected readonly store = inject(CertificationStore);
  private readonly farming = inject(FarmingStore);
  private readonly memberChanges = new Subject<number | null>();

  /** Plots of the member chosen in the registration form (Field Management). */
  protected readonly plots = toSignal(
    this.memberChanges.pipe(
      switchMap((userId) =>
        userId === null
          ? of({ items: [] as PlotSummary[], loading: false, error: false })
          : this.farming.plotSummariesByOwner(userId).pipe(
              map((items: PlotSummary[]) => ({ items, loading: false, error: false })),
              catchError(() => of({ items: [] as PlotSummary[], loading: false, error: true })),
              startWith({ items: [] as PlotSummary[], loading: true, error: false }),
            ),
      ),
    ),
    { initialValue: { items: [] as PlotSummary[], loading: false, error: false } },
  );

  // Store state
  protected readonly busy = this.store.busy;
  protected readonly error = this.store.error;
  protected readonly notice = this.store.notice;

  // UI state
  protected readonly selectedId = signal<number | null>(null);
  protected readonly selected = computed(() =>
    this.store.entries().find(({ batch }) => batch.batchId === this.selectedId()),
  );
  protected readonly registering = signal(false);
  protected readonly crops = Object.values(HarvestCropType);
  protected readonly breadcrumbs = [{ label: 'certification.page-title' }];
  protected readonly coffeeFields = ['aroma', 'flavor', 'acidity', 'body', 'totalScore'] as const;

  protected form = this.emptyForm();
  protected weight = { grossWeightKg: 0, tareKg: 0 };
  protected sample = { sampleIdentifier: '', sampleWeightKg: 0 };
  protected potato = this.emptyPotato();
  protected coffee = this.emptyCoffee();
  protected certificateNumber = '';
  protected search = '';
  protected confirmRevocation = false;

  constructor() {
    effect(() => {
      this.store.user();
      this.selectedId.set(null);
      this.registering.set(false);
      this.resetOperation();
      this.memberChanges.next(null);
    });
  }

  // Actions
  protected startRegistration(): void {
    this.selectedId.set(null);
    this.registering.set(true);
    this.form = this.emptyForm();
    this.memberChanges.next(null);
    this.resetOperation();
  }

  protected selectMember(id: number | null): void {
    this.form.memberId = id;
    this.form.plotId = null;
    const member = this.store.state().members.find((item) => Number(item.id) === id);
    this.memberChanges.next(member?.userId ?? null);
  }

  protected selectBatch(id: number): void {
    this.selectedId.set(id);
    this.registering.set(false);
    this.resetOperation();
  }

  protected register(): void {
    const { memberId, plotId, batchCode, cropType, harvestedOn } = this.form;
    if (memberId === null || plotId === null || !this.plots().items.some((plot) => plot.id === plotId))
      return;
    this.store.registerBatch({ batchCode, memberId, plotId, cropType, harvestedOn }, (batch) =>
      this.selectBatch(batch.batchId),
    );
  }

  protected weigh(batchId: number): void {
    this.store.weighBatch(batchId, this.weight);
  }

  protected extractSample(batchId: number): void {
    this.store.extractSample(batchId, this.sample);
  }

  protected grade(batch: HarvestBatch): void {
    this.store.gradeBatch(batch, this.potato, this.coffee);
  }

  protected issue(batchId: number): void {
    this.store.issueCertificate(batchId, this.certificateNumber);
  }

  protected lookup(): void {
    this.store.findCertificate(this.search, (batchId) => this.selectBatch(batchId));
  }

  protected revoke(certificateId: number): void {
    if (!this.confirmRevocation) {
      this.confirmRevocation = true;
      return;
    }
    this.confirmRevocation = false;
    this.store.revokeCertificate(certificateId);
  }

  protected download(certificate: QualityCertificate): void {
    this.store.downloadCertificate(certificate);
  }

  private resetOperation(): void {
    this.store.clearFeedback();
    this.confirmRevocation = false;
    this.weight = { grossWeightKg: 0, tareKg: 0 };
    this.sample = { sampleIdentifier: '', sampleWeightKg: 0 };
    this.potato = this.emptyPotato();
    this.coffee = this.emptyCoffee();
    this.certificateNumber = '';
  }

  private emptyForm() {
    return {
      batchCode: '',
      memberId: null as number | null,
      plotId: null as number | null,
      cropType: HarvestCropType.ANDEAN_POTATO as HarvestCropType,
      harvestedOn: '',
    };
  }

  private emptyPotato() {
    return { firstPercentage: 0, secondPercentage: 0, thirdPercentage: 0, pestDamagePercentage: 0 };
  }

  private emptyCoffee() {
    return { aroma: 0, flavor: 0, acidity: 0, body: 0, totalScore: 0, fermentDefect: false };
  }
}
