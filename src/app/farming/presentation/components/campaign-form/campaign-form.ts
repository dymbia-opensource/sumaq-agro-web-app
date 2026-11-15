import { Component, computed, inject, input, OnInit, output } from '@angular/core';
import { FarmingStore } from '../../../application/farming.store';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { TranslatePipe } from '@ngx-translate/core';
import { startWith } from 'rxjs';
import { CampaignLedger, YieldUnit } from '../../../domain/model/entities/campaign-ledger.entity';
import { CropCampaign, CropType } from '../../../domain/model/entities/crop-campaign.entity';

/** Seed varieties suggested for each crop (US-34). */
export const SEED_VARIETIES: Record<CropType, readonly string[]> = {
  [CropType.ANDEAN_POTATO]: ['Papa Canchán', 'Papa Yungay', 'Papa Perricholi', 'Papa Única'],
  [CropType.SPECIALTY_COFFEE]: ['Typica', 'Caturra', 'Bourbon', 'Geisha', 'Catimor'],
};

/** Varieties of a crop whose name contains a text, ignoring upper case. */
export function searchSeedVarieties(cropType: CropType, text: string): string[] {
  const query = text.trim().toLowerCase();
  return SEED_VARIETIES[cropType].filter((variety) => variety.toLowerCase().includes(query));
}

/** `true` when the variety typed by the producer is not in the catalog of the crop. */
export function isCustomSeedVariety(cropType: CropType, varietyName: string): boolean {
  return !SEED_VARIETIES[cropType].includes(varietyName.trim());
}

/** Data typed by the producer to start a campaign. */
export interface CampaignFormData {
  cropType: CropType;
  seedVariety: string;
  /** `true` when the variety is not in the catalog. */
  customVariety: boolean;
  sowingDate: Date;
  season: string;
  expectedYield: number | null;
  yieldUnit: YieldUnit;
}

/**
 * Form of a new crop campaign: crop, variety, sowing date and expected yield
 * (US-32 to US-34, US-40). It validates and emits; the view saves.
 */
@Component({
  selector: 'app-campaign-form',
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
  templateUrl: './campaign-form.html',
  styleUrl: './campaign-form.css',
})
export class CampaignForm implements OnInit {
  protected readonly store = inject(FarmingStore);

  private fb = inject(FormBuilder).nonNullable;

  protected readonly cropTypes = Object.values(CropType);

  /** Crop of the previous campaign, suggested for the new one. */
  readonly initialCropType = input<CropType>(CropType.ANDEAN_POTATO);

  /** `true` while the campaign is being saved. */
  readonly saving = input(false);

  /** The form is valid and the producer wants to start the campaign. */
  readonly submitted = output<CampaignFormData>();

  /** The producer leaves without saving. */
  readonly cancel = output<void>();

  protected readonly form = this.fb.group({
    cropType: [CropType.ANDEAN_POTATO],
    seedVariety: ['', [Validators.required, Validators.maxLength(60)]],
    sowingDate: ['', Validators.required],
    expectedYield: [null as number | null, [Validators.min(1)]],
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

  private readonly sowingDateText = toSignal(
    this.form.controls.sowingDate.valueChanges.pipe(startWith(this.form.controls.sowingDate.value)),
    { requireSync: true },
  );

  /** Varieties of the selected crop that match what the producer typed (US-34). */
  protected readonly varieties = computed(() =>
    searchSeedVarieties(this.cropType(), this.varietyText()),
  );

  /** Unit of the expected yield: sacks for potato, quintals for coffee. */
  protected readonly yieldUnit = computed(() => this.store.yieldUnitOf(this.cropType()));

  /** Season of the sowing date, e.g. `2026-II`. */
  protected readonly season = computed(() => {
    const date = CampaignForm.toDate(this.sowingDateText());
    return date ? this.store.seasonOf(date) : '';
  });

  ngOnInit(): void {
    this.form.controls.cropType.setValue(this.initialCropType());
  }

  protected onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const sowingDate = CampaignForm.toDate(value.sowingDate)!;
    this.submitted.emit({
      cropType: value.cropType,
      seedVariety: value.seedVariety,
      customVariety: isCustomSeedVariety(value.cropType, value.seedVariety),
      sowingDate,
      season: this.store.seasonOf(sowingDate),
      expectedYield: value.expectedYield,
      yieldUnit: this.yieldUnit(),
    });
  }

  /** Reads the `YYYY-MM-DD` value of a date input as a local date. */
  private static toDate(value: string): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}
