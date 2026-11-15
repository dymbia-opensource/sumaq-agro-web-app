import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';

/** Breakeven price of the campaign and the expected yield it depends on (US-40). */
@Component({
  selector: 'app-breakeven-panel',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './breakeven-panel.html',
  styleUrl: './breakeven-panel.css',
})
export class BreakevenPanel {
  readonly ledger = input.required<CampaignLedger>();
  readonly saving = input(false);

  /** The producer typed a new expected yield. */
  readonly expectedYieldChange = output<number>();

  protected readonly form = new FormGroup({
    expectedYield: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
  });
  protected readonly expectedYield = this.form.controls.expectedYield;

  constructor() {
    // Show the saved value every time the ledger changes.
    effect(() => {
      const value = this.ledger().expectedYield;
      this.expectedYield.reset(value > 0 ? value : null);
    });
  }

  protected onSave() {
    if (this.expectedYield.invalid) {
      this.expectedYield.markAsTouched();
      return;
    }
    this.expectedYieldChange.emit(this.expectedYield.value!);
  }
}
