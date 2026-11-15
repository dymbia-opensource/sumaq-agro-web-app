import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

/** Parcel selection control; the parent view owns data loading and selection state. */
@Component({
  selector: 'app-crop-plot-selector',
  imports: [MatFormFieldModule, MatSelectModule, TranslatePipe],
  templateUrl: './plot-selector.html',
  styleUrl: './plot-selector.css',
})
export class CropPlotSelector {
  readonly plots = input.required<readonly { id: number | string; name: string }[]>();
  readonly selectedPlotId = input<number | string | undefined>();
  readonly disabled = input(false);
  readonly plotSelected = output<number | string>();
}
