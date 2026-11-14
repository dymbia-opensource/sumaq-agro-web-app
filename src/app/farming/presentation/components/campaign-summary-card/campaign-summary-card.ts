import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { Money } from '../../../../shared/domain/model/money';
import { FarmingStore } from '../../../application/farming.store';
import { CampaignLedger, YieldUnit } from '../../../domain/model/entities/campaign-ledger.entity';
import {
  CropCampaign,
  CampaignStatus,
  CropType,
} from '../../../domain/model/entities/crop-campaign.entity';

/** One campaign of a plot with the main figures of its cost ledger (`CampaignSummary`). */
export interface CampaignSummary {
  campaignId: number;
  plotId: number;
  season: string;
  cropType: CropType;
  seedVariety: string;
  sowingDate: Date | null;
  status: CampaignStatus;
  /** `true` while the campaign is in progress. */
  isActive: boolean;
  /** `null` when the campaign has no cost ledger yet. */
  ledgerId: number | null;
  totalInvestment: Money;
  breakevenPrice: Money;
  expectedYield: number;
  actualYield: number | null;
  yieldUnit: YieldUnit;
  expenseCount: number;
  costPerHectare: Money;
  /** Actual yield compared with the expected one, in % (100 = as expected), or `null`. */
  yieldAchievement: number | null;
}

/**
 * Builds the summary of a campaign.
 * @param store - Field Management store, which knows the yield unit of each crop.
 * @param campaign - The campaign.
 * @param ledger - Its cost ledger, if it has one.
 * @param areaHectares - Area of the plot, for the cost per hectare.
 */
export function campaignSummaryOf(
  store: FarmingStore,
  campaign: CropCampaign,
  ledger: CampaignLedger | null,
  areaHectares: number,
): CampaignSummary {
  const expectedYield = ledger?.expectedYield ?? 0;
  const actualYield = ledger?.actualYield ?? null;
  return {
    campaignId: campaign.id as number,
    plotId: campaign.plotId,
    season: campaign.season,
    cropType: campaign.cropType,
    seedVariety: campaign.seedVariety,
    sowingDate: campaign.sowingDate,
    status: campaign.status,
    isActive: campaign.isActive(),
    ledgerId: ledger ? (ledger.id as number) : null,
    totalInvestment: ledger ? ledger.totalInvestment() : new Money(0),
    breakevenPrice: ledger ? ledger.breakevenPrice() : new Money(0),
    expectedYield,
    actualYield,
    yieldUnit: ledger?.yieldUnit ?? store.yieldUnitOf(campaign.cropType),
    expenseCount: ledger?.entries.length ?? 0,
    costPerHectare: ledger ? ledger.costPerHectare(areaHectares) : new Money(0),
    yieldAchievement:
      actualYield === null || expectedYield <= 0 ? null : (actualYield / expectedYield) * 100,
  };
}

/** Card of one campaign of the plot: crop, sowing, investment and yield (`CampaignSummary`). */
@Component({
  selector: 'app-campaign-summary-card',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './campaign-summary-card.html',
  styleUrl: './campaign-summary-card.css',
})
export class CampaignSummaryCard {
  readonly summary = input.required<CampaignSummary>();

  /** `true` while a change is being saved. */
  readonly saving = input(false);

  /** The producer wants to close the campaign. */
  readonly closeCampaign = output<CampaignSummary>();

  /** The producer wants to download the cost report. */
  readonly exportReport = output<CampaignSummary>();
}
