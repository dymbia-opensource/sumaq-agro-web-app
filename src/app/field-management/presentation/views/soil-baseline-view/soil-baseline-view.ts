import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { FieldManagementStore } from '../../../application/field-management.store';
import { RecordSoilBaselineCommand } from '../../../domain/model/commands/record-soil-baseline.command';
import { SoilBaselineData, SoilBaselineForm } from '../../components/soil-baseline-form/soil-baseline-form';

/** Records the initial soil analysis of a plot (`RecordSoilBaseline`). */
@Component({
  selector: 'app-soil-baseline-view',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    SoilBaselineForm,
  ],
  templateUrl: './soil-baseline-view.html',
  styleUrl: './soil-baseline-view.css',
})
export class SoilBaselineView {
  private readonly router = inject(Router);
  private readonly store = inject(FieldManagementStore);

  /** ID taken from the route `plots/:id/soil`. */
  readonly id = input.required({ transform: numberAttribute });

  // Store state
  readonly loading = this.store.loading;
  readonly plotsLoading = this.store.plotsLoading;
  readonly error = this.store.error;
  readonly plot = computed(() => this.store.getPlotById(this.id())());

  // UI state
  readonly breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'option.my-plot', link: '/dashboard' },
    { label: 'field-management.plots.manage', link: '/field-management/plots' },
    { label: 'field-management.plot-detail.title', link: `/field-management/plots/${this.id()}` },
    { label: 'field-management.soil.title' },
  ]);

  // Actions
  /** Turns the form data into a domain command and sends it to the store. */
  onRecord(data: SoilBaselineData) {
    this.store.recordSoilBaseline(new RecordSoilBaselineCommand({ plotId: this.id(), ...data }), () =>
      this.onCancel(),
    );
  }

  onCancel() {
    this.router.navigate(['/field-management/plots', this.id()]).then();
  }
}
