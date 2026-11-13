import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FarmerAdvisoryPanel } from '../../../../profiles/presentation/components/farmer-advisory-panel/farmer-advisory-panel';
import { CropPlotSelector } from '../../components/plot-selector/plot-selector';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { CropHealthStore } from '../../../application/crop-health.store';

@Component({
  selector: 'app-diagnosis-inbox-view',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    FarmerAdvisoryPanel,
    CropPlotSelector,
    PageHeader,
    RouterLink,
    TranslatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './diagnosis-inbox-view.html',
  styleUrl: './diagnosis-inbox-view.css',
})
/** Role-scoped work list with independent plot, severity and workflow filters. */
export class DiagnosisInboxView {
  readonly store = inject(CropHealthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  readonly deletingId = signal<number | null>(null);
  readonly plotFilter = signal(0);
  readonly severityFilter = signal('ALL');
  readonly statusFilter = signal('ALL');
  readonly reports = computed(() =>
    this.store
      .pestReports()
      .filter(
        (report) =>
          (!this.plotFilter() || report.plotId === this.plotFilter()) &&
          (this.severityFilter() === 'ALL' || report.severity === this.severityFilter()) &&
          (this.statusFilter() === 'ALL' || report.status === this.statusFilter()),
      )
      .sort((a, b) => Number(b.id) - Number(a.id)),
  );
  /** Clears filters without changing the authorization scope or selected satellite plot. */
  resetFilters(): void {
    this.plotFilter.set(0);
    this.severityFilter.set('ALL');
    this.statusFilter.set('ALL');
  }
  /** Refreshes access after a changed assignment or failed request. */
  reload(): void {
    this.store.retryScope();
  }
  constructor() {
    effect(() => {
      const ready = this.store.scopeReady();
      untracked(() => {
        this.deletingId.set(null);
        this.resetFilters();
        const requested = Number(this.route.snapshot.queryParamMap.get('plotId'));
        if (ready && this.store.plots().some((plot) => plot.id === requested))
          this.plotFilter.set(requested);
        if (ready) this.store.loadClinicalData();
      });
    });
  }
  remove(id: number): void {
    this.store.deleteReport(
      id,
      () => {
        this.deletingId.set(null);
        this.snackBar.open(this.translate.instant('crop-health.report-deleted'), undefined, {
          duration: 5000,
        });
      },
      () => this.deletingId.set(null),
    );
  }
}
