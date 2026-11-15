import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SatelliteObservation } from '../../../../crop/domain/model/entities/satellite-observation.entity';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../../../domain/model/entities/crop-campaign.entity';
import { ExpenseCategory } from '../../../domain/model/entities/expense-entry.entity';

/** KPI cards of the dashboard: leaf health, total spend and breakeven price. */
@Component({
  selector: 'app-campaign-kpi-cards',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './campaign-kpi-cards.html',
  styleUrl: './campaign-kpi-cards.css',
})
export class CampaignKpiCards {
  /** Active campaign of the selected plot. */
  readonly campaign = input<CropCampaign>();

  /** Cost ledger of the campaign, or `null` if it has none. */
  readonly ledger = input<CampaignLedger | null>(null);

  /** Latest satellite observation of the plot. */
  readonly observation = input<SatelliteObservation>();

  /** `true` while the satellite observations are loading. */
  readonly satelliteLoading = input(false);

  /** `true` when the satellite observations could not be loaded. */
  readonly satelliteError = input(false);

  /** Share of each expense category in the total investment. */
  protected readonly categoryShares = computed(() => {
    const ledger = this.ledger();
    if (!ledger) return [];
    return Object.values(ExpenseCategory).map((category) => ({
      label: `farming.expense-category.${category}`,
      percentage: ledger.percentageByCategory(category),
    }));
  });
}
