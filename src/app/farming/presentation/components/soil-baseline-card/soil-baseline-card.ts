import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CropType } from '../../../domain/model/entities/crop-campaign.entity';
import { SoilBaseline } from '../../../domain/model/entities/field-plot.entity';

/** Initial soil analysis of the plot, with the advice the domain gives for its crop. */
@Component({
  selector: 'app-soil-baseline-card',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './soil-baseline-card.html',
  styleUrl: './soil-baseline-card.css',
})
export class SoilBaselineCard {
  /** Soil analysis, or `null` if it was not recorded. */
  readonly soilBaseline = input.required<SoilBaseline | null>();

  /** Crop of the current campaign, for the advice. */
  readonly cropType = input<CropType>();

  /** Route of the soil analysis form. */
  readonly recordLink = input.required<string | unknown[]>();

  /** Lowest pH each crop tolerates before the soil needs lime. */
  private static readonly MINIMUM_PH: Record<CropType, number> = {
    [CropType.ANDEAN_POTATO]: 5.5,
    [CropType.SPECIALTY_COFFEE]: 5.0,
  };

  /** `true` when the soil is too acid for the crop and needs lime before sowing. */
  protected needsLiming(soil: SoilBaseline, cropType: CropType): boolean {
    return soil.ph < SoilBaselineCard.MINIMUM_PH[cropType];
  }

  /** `true` when the soil has less than 2 % of organic matter and needs compost. */
  protected isLowInOrganicMatter(soil: SoilBaseline): boolean {
    return soil.organicMatterPercentage < 2;
  }
}
