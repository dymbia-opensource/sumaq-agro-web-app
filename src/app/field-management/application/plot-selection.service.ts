import { computed, inject, Injectable, signal } from '@angular/core';
import { SessionContext } from '../../iam/application/session-context';

/** Session-scoped plot identity shared without loading plots, campaigns or ledgers. */
@Injectable({ providedIn: 'root' })
export class PlotSelectionService {
  private readonly session = inject(SessionContext);
  private readonly selection = signal<{
    participant: ReturnType<SessionContext['activeUser']>;
    plotId: number | null;
  } | null>(null);

  readonly selectedPlotId = computed(() => {
    const selection = this.selection();
    return selection?.participant === this.session.activeUser()
      ? (selection?.plotId ?? null)
      : null;
  });

  /** Callers validate that the selected identity belongs to their accessible plot list. */
  select(plotId: number | null): void {
    if (plotId !== null && (!Number.isSafeInteger(plotId) || plotId <= 0)) return;
    const participant = this.session.activeUser();
    this.selection.set(participant ? { participant, plotId } : null);
  }
}
