import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ProfilesStore } from '../../../application/profiles.store';
import { PlotResponsibility } from '../../../domain/model/entities/plot-responsibility';
import { AdvisorSummary } from '../../../domain/model/entities/advisor-summary';

@Component({
  selector: 'app-plot-advisor-assignment',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    TranslatePipe,
  ],
  templateUrl: './plot-advisor-assignment.html',
  styleUrl: './plot-advisor-assignment.css',
})
export class PlotAdvisorAssignment {
  readonly cooperativeId = input.required<number>();
  readonly plotId = input.required<number>();
  readonly producerUserId = input.required<number>();
  private readonly store = inject(ProfilesStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly responsibility = signal<PlotResponsibility | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selected = signal<number | null>(null);
  /** Name of the agronomist in charge, read from its profile. */
  protected readonly advisorName = signal<string | null>(null);
  /** Agronomists of the technical team the director can put in charge. */
  protected readonly team = signal<AdvisorSummary[]>([]);

  constructor() {
    effect((onCleanup) => {
      const request = this.store.technicalTeamOf(this.cooperativeId()).subscribe({
        next: (team) => this.team.set(team),
        error: () => this.team.set([]),
      });
      onCleanup(() => request.unsubscribe());
    });
    effect((onCleanup) => {
      const id = this.plotId();
      this.loading.set(true);
      this.error.set(null);
      const request = this.store.responsibilityByPlot(id).subscribe({
        next: (current) => {
          const active = current?.status === 'ACTIVE' ? current : null;
          this.showResponsibility(active);
          this.selected.set(active?.advisorUserId ?? null);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('profiles.advisory.errors.load');
        },
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  protected validId(): boolean {
    const id = this.selected();
    return id !== null && Number.isSafeInteger(id) && id > 0;
  }

  protected assign(): void {
    const id = this.selected();
    if (id === null || !this.validId() || this.saving() || this.loading()) return;

    this.error.set(null);
    this.saving.set(true);
    this.store
      .assignPlotAdvisor(this.cooperativeId(), this.plotId(), this.producerUserId(), id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.showResponsibility(saved);
          this.saving.set(false);
        },
        error: (reason: unknown) => {
          this.saving.set(false);
          const detail =
            reason instanceof HttpErrorResponse && [400, 409, 422].includes(reason.status)
              ? reason.error?.details || reason.error?.detail
              : null;
          this.error.set(
            typeof detail === 'string' && detail.trim() ? detail : 'profiles.advisory.errors.save',
          );
        },
      });
  }

  /** Shows the responsibility and looks up the name of its agronomist. */
  private showResponsibility(responsibility: PlotResponsibility | null): void {
    this.responsibility.set(responsibility);
    this.advisorName.set(null);
    if (!responsibility) return;
    this.store
      .advisorByUser(responsibility.advisorUserId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((advisor) => this.advisorName.set(advisor?.name ?? null));
  }
}
