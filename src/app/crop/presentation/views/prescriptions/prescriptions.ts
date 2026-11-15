import { DatePipe } from '@angular/common';
import { Component, effect, inject, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import {
  Breadcrumb,
  PageHeader,
} from '../../../../shared/presentation/components/page-header/page-header';
import { CropStore } from '../../../application/crop.store';

@Component({
  selector: 'app-prescriptions',
  imports: [
    DatePipe,
    TranslatePipe,
    PageHeader,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
  ],
  templateUrl: './prescriptions.html',
  styleUrl: './prescriptions.css',
})
export class Prescriptions {
  /** The inbox, which each menu names its own way, then this page. */
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.diagnosis-inbox', link: '/pest-reports' },
    { label: 'crop.history-title' },
  ];

  readonly store = inject(CropStore);
  constructor() {
    effect(() => {
      const ready = this.store.scopeReady();
      untracked(() => {
        if (ready) this.load();
      });
    });
  }
  private load(): void {
    this.store.loadClinicalData();
  }
}
