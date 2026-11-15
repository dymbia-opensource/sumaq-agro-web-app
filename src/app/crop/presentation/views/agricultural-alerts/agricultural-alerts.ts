import { CropPlotSelector } from '../../components/plot-selector/plot-selector';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { CropStore } from '../../../application/crop.store';

/**
 * Agroclimatic Alerts View.
 *
 * @remarks
 * Lists all active weather and environmental alerts for the user's region.
 * Severity levels are reflected through CSS classes for visual distinction.
 */
@Component({
  selector: 'app-agricultural-alerts',
  imports: [
    CropPlotSelector,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    MatIconModule,
    MatProgressBarModule,
    PageHeader,
  ],
  templateUrl: './agricultural-alerts.html',
  styleUrl: './agricultural-alerts.css',
})
export class AgriculturalAlerts {
  /** Application store that holds all crop-health signals. */
  readonly store = inject(CropStore);

  protected readonly published = signal(false);
  protected readonly bulletinForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/S/)],
    }),
    content: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/S/)],
    }),
  });

  protected publish(): void {
    if (this.bulletinForm.invalid || this.store.saving()) return;
    this.published.set(false);
    const { title, content } = this.bulletinForm.getRawValue();
    this.store.publishBulletin(title, content, () => {
      this.bulletinForm.reset();
      this.published.set(true);
    });
  }

  protected reloadAlerts(): void {
    const plot = this.store.selectedPlot();
    if (plot) this.store.loadRegionalData(plot.region);
  }

  /** Loads agroclimatic alerts for the user's region on component init. */
  constructor() {
    effect(() => {
      const plot = this.store.selectedPlot();
      untracked(() => {
        this.published.set(false);
        this.bulletinForm.reset();
        this.store.clearError();
        if (plot) this.store.loadRegionalData(plot.region);
      });
    });
  }
}
