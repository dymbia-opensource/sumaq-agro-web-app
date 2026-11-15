import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { toApiDate } from '../../../../shared/infrastructure/api-date';
import { SoilBaseline, SoilTexture } from '../../../domain/model/entities/field-plot.entity';

/** Data typed by the producer from the soil analysis. */
export interface SoilBaselineData {
  ph: number;
  texture: SoilTexture;
  organicMatterPercentage: number;
  recordedAt: Date;
}

/** Form of the initial soil analysis (`RecordSoilBaseline`). It validates and emits; the view saves. */
@Component({
  selector: 'app-soil-baseline-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './soil-baseline-form.html',
  styleUrl: './soil-baseline-form.css',
})
export class SoilBaselineForm {
  private fb = inject(FormBuilder).nonNullable;

  /** Analysis already recorded, shown to be updated. */
  readonly current = input<SoilBaseline | null>(null);
  readonly saving = input(false);

  readonly submitted = output<SoilBaselineData>();
  readonly cancel = output<void>();

  protected readonly textures = Object.values(SoilTexture);
  protected readonly today = toApiDate(new Date());

  protected readonly form = this.fb.group({
    ph: [null as number | null, [Validators.required, Validators.min(0), Validators.max(14)]],
    texture: [SoilTexture.LOAMY, Validators.required],
    organicMatterPercentage: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
    recordedAt: [this.today, Validators.required],
  });

  constructor() {
    // Show the analysis already recorded.
    effect(() => {
      const soil = this.current();
      if (!soil) return;
      this.form.reset({
        ph: soil.ph,
        texture: soil.texture,
        organicMatterPercentage: soil.organicMatterPercentage,
        recordedAt: toApiDate(soil.recordedAt),
      });
    });
  }

  protected onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const [year, month, day] = value.recordedAt.split('-').map(Number);
    this.submitted.emit({
      ph: value.ph!,
      texture: value.texture,
      organicMatterPercentage: value.organicMatterPercentage!,
      recordedAt: new Date(year, month - 1, day),
    });
  }
}
