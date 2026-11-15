import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { CropCampaign } from '../../../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../../../domain/model/entities/field-plot.entity';

/** Cadastral data of a plot: area, region, vertices and AgroMonitoring link. */
@Component({
  selector: 'app-plot-cadastre-card',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatChipsModule, MatIconModule, TranslatePipe],
  templateUrl: './plot-cadastre-card.html',
  styleUrl: './plot-cadastre-card.css',
})
export class PlotCadastreCard {
  readonly plot = input.required<FieldPlot>();

  /** Current campaign of the plot, if it has one. */
  readonly campaign = input<CropCampaign>();
}
