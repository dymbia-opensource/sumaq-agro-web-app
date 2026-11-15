import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Steps 1 and 2 of the plot registration, as pills. */
@Component({
  selector: 'app-registration-steps',
  imports: [TranslatePipe],
  templateUrl: './registration-steps.html',
  styleUrl: './registration-steps.css',
})
export class RegistrationSteps {
  /** Step the producer is in: 1 (crop data) or 2 (map). */
  readonly current = input.required<1 | 2>();

  /** Number and i18n key of each step. */
  protected readonly steps = [
    { number: 1, label: 'farming.steps.crop-data' },
    { number: 2, label: 'farming.steps.map-title' },
  ];
}
