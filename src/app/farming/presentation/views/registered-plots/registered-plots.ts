import { PlotQuotaSummary } from '../../components/plot-quota-summary/plot-quota-summary';
import { Component, computed, inject, Signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  Breadcrumb,
  PageHeader,
} from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { FarmingStore } from '../../../application/farming.store';
import { FieldPlot } from '../../../domain/model/entities/field-plot.entity';
import { PlotCard } from '../../components/plot-card/plot-card';
import { PlotSlotCard } from '../../components/plot-slot-card/plot-slot-card';

/** "My registered plots": one card per plot and one per free slot of the plan (US-22, US-28). */
@Component({
  selector: 'app-registered-plots',
  imports: [
    PlotQuotaSummary,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    PlotCard,
    PlotSlotCard,
  ],
  templateUrl: './registered-plots.html',
  styleUrl: './registered-plots.css',
})
export class RegisteredPlots {
  private readonly farmingStore = inject(FarmingStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // Store state
  /** Account-scoped plot collection exposed with an explicit template contract. */
  readonly plots: Signal<FieldPlot[]> = this.farmingStore.plots;
  readonly loading = this.farmingStore.loading;
  readonly error = this.farmingStore.error;
  readonly plotCount = this.farmingStore.plotCount;
  readonly plotQuota = this.farmingStore.plotQuota;
  readonly canRegisterPlot = this.farmingStore.canRegisterPlot;
  readonly plotQuotaReady = this.farmingStore.plotQuotaReady;
  readonly ownedPlotsReady = this.farmingStore.ownedPlotsReady;
  readonly plotQuotaReached = this.farmingStore.plotQuotaReached;
  readonly registrationIncomplete = this.farmingStore.registrationIncomplete;

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'farming.plots.manage' },
  ];

  /** Free slot numbers are shown only after the current producer quota has loaded. */
  readonly freeSlots: Signal<number[]> = computed<number[]>(() =>
    !this.canRegisterPlot()
      ? []
      : Array.from(
          { length: Math.max(this.plotQuota() - this.plotCount(), 0) },
          (_, index) => this.plotCount() + index + 1,
        ),
  );

  /** Current campaign of each plot, by plot ID. */
  readonly campaigns = computed(
    () =>
      new Map(
        this.plots().map((plot) => [
          plot.id,
          this.farmingStore.getCurrentCampaignOf(plot.id as number)(),
        ]),
      ),
  );

  // Actions
  onRegisterNewPlot() {
    if (!this.canRegisterPlot()) return;
    this.router.navigate(['/plots/new']).then();
  }

  onSelectPlot(plot: FieldPlot) {
    this.farmingStore.selectPlot(plot.id as number);
    this.router.navigate(['dashboard']).then();
  }

  onViewMonitoring(plot: FieldPlot) {
    this.farmingStore.selectPlot(plot.id as number);
    this.router.navigate(['/monitoring']).then();
  }

  onDelineate(plot: FieldPlot) {
    this.router.navigate(['/plots', plot.id, 'boundary']).then();
  }

  onViewDetail(plot: FieldPlot) {
    this.router.navigate(['/plots', plot.id]).then();
  }

  onRecordSoil(plot: FieldPlot) {
    this.router.navigate(['/plots', plot.id, 'soil']).then();
  }

  /** Deletes the plot only if the producer confirms. */
  onDeletePlot(plot: FieldPlot) {
    const message = this.translate.instant('farming.plots.delete-confirm', {
      name: plot.name,
    });
    if (confirm(message)) {
      this.farmingStore.deletePlot(plot.id as number);
    }
  }
}
