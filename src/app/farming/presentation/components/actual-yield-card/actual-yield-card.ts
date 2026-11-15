import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';

/**
 * Form of the yield actually harvested (`RecordActualYield`).
 *
 * @remarks
 * Harvest Certification records it when the batch is weighed (policy P10);
 * the producer can also type it after the harvest.
 */
@Component({
  selector: 'app-actual-yield-card',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './actual-yield-card.html',
  styleUrl: './actual-yield-card.css',
})
export class ActualYieldCard {
  readonly ledger = input.required<CampaignLedger>();
  readonly saving = input(false);

  /** The producer typed the harvested yield. */
  readonly actualYieldChange = output<number>();

  protected readonly form = new FormGroup({
    actualYield: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
  });
  protected readonly actualYield = this.form.controls.actualYield;

  constructor() {
    // Show the saved value every time the ledger changes.
    effect(() => this.actualYield.reset(this.ledger().actualYield));
  }

  protected onSave() {
    if (this.actualYield.invalid) {
      this.actualYield.markAsTouched();
      return;
    }
    this.actualYieldChange.emit(this.actualYield.value!);
  }
}
