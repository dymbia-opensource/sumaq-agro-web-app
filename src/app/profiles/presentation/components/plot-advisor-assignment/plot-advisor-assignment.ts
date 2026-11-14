import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfilesStore } from '../../../application/profiles.store';
import { PlotResponsibility } from '../../../domain/model/entities/plot-responsibility';

/**
 * Supervision of one plot of a member, assigned by the cooperative director (US-20).
 *
 * @remarks
 * The team of advisors comes from the store, already loaded for the cooperative
 * of the director. Removing the assignment leaves the plot out of the panel of
 * that advisor, which is the second scenario of the story.
 */
@Component({
  selector: 'app-plot-advisor-assignment',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './plot-advisor-assignment.html',
  styleUrl: './plot-advisor-assignment.css',
})
export class PlotAdvisorAssignment {
  /** Plot of the member that is being supervised. */
  readonly plotId = input.required<number>();

  /** Account of the member who owns the plot. */
  readonly producerUserId = input.required<number>();

  private readonly store = inject(ProfilesStore);
  private readonly destroyRef = inject(DestroyRef);

  /** Advisors of the cooperative that already have a linked account. */
  protected readonly advisors = computed(() =>
    this.store.technicalAdvisors().filter((advisor) => advisor.userId !== undefined),
  );

  protected readonly responsibility = signal<PlotResponsibility | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selected = signal<number | null>(null);

  /** Name of the advisor in charge, or null when nobody supervises the plot. */
  protected readonly responsible = computed(() => {
    const current = this.responsibility();

    return current
      ? (this.advisors().find((advisor) => advisor.userId === current.advisorUserId)?.name ?? null)
      : null;
  });

  constructor() {
    effect(() => {
      this.plotId();
      untracked(() => this.load());
    });
  }

  private load(): void {
    this.error.set(null);
    this.loading.set(true);
    this.store
      .responsibilityByPlot(this.plotId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (current) => {
          const active = current?.status === 'ACTIVE' ? current : null;
          this.responsibility.set(active);
          this.selected.set(active?.advisorUserId ?? null);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('profiles.advisory.errors.load');
        },
      });
  }

  /** Links the plot to the chosen advisor. */
  protected assign(): void {
    const advisorUserId = this.selected();
    if (advisorUserId === null || this.saving() || this.loading()) return;

    this.error.set(null);
    this.saving.set(true);
    this.store
      .assignPlotAdvisor(this.plotId(), this.producerUserId(), advisorUserId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.responsibility.set(saved);
          this.saving.set(false);
        },
        error: (reason: Error) => {
          this.saving.set(false);
          this.error.set(
            reason.message.startsWith('profiles.advisory.errors.')
              ? reason.message
              : 'profiles.advisory.errors.save',
          );
        },
      });
  }

  /** Removes the supervision, so the plot leaves the panel of that advisor. */
  protected release(): void {
    if (this.saving() || this.loading() || !this.responsibility()) return;

    this.error.set(null);
    this.saving.set(true);
    this.store
      .releasePlotAdvisor(this.plotId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.responsibility.set(null);
          this.selected.set(null);
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
          this.error.set('profiles.advisory.errors.save');
        },
      });
  }
}
