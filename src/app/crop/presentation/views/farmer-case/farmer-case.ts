import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  Breadcrumb,
  PageHeader,
} from '../../../../shared/presentation/components/page-header/page-header';
import { CropStore } from '../../../application/crop.store';

@Component({
  selector: 'app-farmer-case',
  imports: [
    PageHeader,
    DatePipe,
    RouterLink,
    TranslatePipe,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
  ],
  templateUrl: './farmer-case.html',
  styleUrl: './farmer-case.css',
})
export class FarmerCase {
  private readonly translate = inject(TranslateService);
  readonly locale = computed(() => (this.translate.currentLang() === 'es' ? 'es' : 'en'));
  readonly id = input.required({ transform: numberAttribute });
  readonly store = inject(CropStore);
  readonly loaded = signal(false);
  readonly confirming = signal<number | null>(null);

  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.diagnosis-inbox', link: '/pest-reports' },
    { label: 'crop.case.title' },
  ];
  readonly report = computed(() => this.store.pestReports().find((item) => item.id === this.id()));
  readonly inspections = computed(() =>
    this.store.inspections().filter((item) => item.reportId === this.id()),
  );
  readonly prescriptions = computed(() =>
    this.store.prescriptions().filter((item) => item.reportId === this.id()),
  );

  constructor() {
    effect(() => {
      const ready = this.store.scopeReady();
      const id = this.id();
      untracked(() => {
        this.loaded.set(false);
        this.confirming.set(null);
        if (ready && Number.isSafeInteger(id) && id > 0) this.reload();
        else if (ready) this.loaded.set(true);
      });
    });
  }

  reload(): void {
    this.loaded.set(false);
    if (this.store.scopeError()) {
      this.store.retryScope();
      return;
    }
    this.store.loadClinicalData(() => this.loaded.set(true));
  }

  apply(id: number): void {
    if (this.confirming() !== id || this.store.saving()) return;
    this.store.applyPrescription(id, () => this.confirming.set(null));
  }
}
