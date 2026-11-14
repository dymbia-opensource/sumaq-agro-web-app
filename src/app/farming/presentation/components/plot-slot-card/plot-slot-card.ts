import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/** Card of a free slot of the plan to register a new plot (US-22). */
@Component({
  selector: 'app-plot-slot-card',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, TranslatePipe],
  templateUrl: './plot-slot-card.html',
  styleUrl: './plot-slot-card.css',
})
export class PlotSlotCard {
  /** Position of the free slot in the plan. */
  readonly position = input.required<number>();

  /** The producer wants to register a plot in this slot. */
  readonly register = output<void>();
}
