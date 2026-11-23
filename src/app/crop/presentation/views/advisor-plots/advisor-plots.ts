import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { CropStore } from '../../../application/crop.store';

/** Assigned plot directory, including plots without cases and producers outside cooperatives. */
@Component({
  selector: 'app-advisor-plots',
  imports: [
    RouterLink,
    TranslatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    PageHeader,
  ],
  templateUrl: './advisor-plots.html',
  styles: [
    ':host { display: block; max-width: 1100px; margin: auto; } .plots { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr)); gap:16px; } mat-card-content { padding-top:16px; } app-page-header { margin-bottom:20px; } mat-card-content { display:flex; flex-direction:column; gap:12px; } .producer { display:flex; align-items:center; gap:8px; margin:0; } .producer mat-icon { color: var(--mat-sys-on-surface-variant); } .badges { display:flex; flex-wrap:wrap; gap:8px; } .badge { padding:4px 12px; border-radius:999px; font: var(--mat-sys-label-large); background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container); } .badge--warn { background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container); }',
  ],
})
export class AdvisorPlots {
  readonly store = inject(CropStore);
  constructor() {
    effect(() => {
      const ready = this.store.scopeReady();
      untracked(() => {
        if (ready) this.store.loadClinicalData();
      });
    });
  }
  /** Counts all unresolved cases, including those awaiting farmer follow-up. */
  pending(plotId: number): number {
    return this.store
      .pestReports()
      .filter((report) => report.plotId === plotId && report.status !== 'RESOLVED').length;
  }
  /** Resolves fresh responsibilities before reloading work-list totals. */
  reload(): void {
    this.store.retryScope();
  }
}
