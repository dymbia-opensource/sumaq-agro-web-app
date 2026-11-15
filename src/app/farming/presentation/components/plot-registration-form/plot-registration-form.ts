import { Component, computed, inject, input, output } from '@angular/core';
import { FarmingStore } from '../../../application/farming.store';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { TranslatePipe } from '@ngx-translate/core';
import { startWith } from 'rxjs';
import { CropType } from '../../../domain/model/entities/crop-campaign.entity';
import { isCustomSeedVariety, searchSeedVarieties } from '../campaign-form/campaign-form';

/** Data typed by the producer in the plot registration form. */
export interface PlotRegistrationData {
  name: string;
  region: string;
  cropType: CropType;
  seedVariety: string;
  /** `true` when the variety is not one of the suggested ones. */
  customVariety: boolean;
  sowingDate: Date;
  declaredAreaHectares: number;
}

/** Form with the data of the land and its crop; it validates and emits, the view saves. */
@Component({
  selector: 'app-plot-registration-form',
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    TranslatePipe,
  ],
  templateUrl: './plot-registration-form.html',
  styleUrl: './plot-registration-form.css',
})
export class PlotRegistrationForm {
  protected readonly store = inject(FarmingStore);

  private fb = inject(FormBuilder);

  protected readonly cropTypes = Object.values(CropType);

  /** `true` while the plot is being saved. */
  readonly saving = input(false);

  /** The form is valid and the producer wants to continue. */
  readonly submitted = output<PlotRegistrationData>();

  /** The producer leaves without saving. */
  readonly cancel = output<void>();

  /**
   * Form group for the plot registration form.
   */
  form = this.fb.group({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    cropType: new FormControl<CropType>(CropType.ANDEAN_POTATO, { nonNullable: true }),
    seedVariety: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    region: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    sowingDate: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    declaredArea: new FormControl<number | null>(null, [Validators.min(0.01)]),
  });

  private readonly cropType = toSignal(
    this.form.controls.cropType.valueChanges.pipe(startWith(this.form.controls.cropType.value)),
    { requireSync: true },
  );

  private readonly varietyText = toSignal(
    this.form.controls.seedVariety.valueChanges.pipe(
      startWith(this.form.controls.seedVariety.value),
    ),
    { requireSync: true },
  );

  /** Varieties of the selected crop that match what the producer typed (US-34). */
  readonly varieties = computed(() => searchSeedVarieties(this.cropType(), this.varietyText()));

  /** Sends the data when the form is valid; otherwise shows the errors. */
  onSubmit() {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const [year, month, day] = value.sowingDate.split('-').map(Number);
    this.submitted.emit({
      name: value.name,
      region: value.region,
      cropType: value.cropType,
      seedVariety: value.seedVariety,
      customVariety: isCustomSeedVariety(value.cropType, value.seedVariety),
      sowingDate: new Date(year, month - 1, day),
      declaredAreaHectares: value.declaredArea ?? 0,
    });
  }
}
