import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { FieldManagementStore } from '../../../application/field-management.store';
import { CloseCropCampaignCommand } from '../../../domain/model/commands/close-crop-campaign.command';
import { ExportCampaignCostReportCommand } from '../../../domain/model/commands/export-campaign-cost-report.command';
import { RecordActualYieldCommand } from '../../../domain/model/commands/record-actual-yield.command';
import {
  CampaignSummary,
  CampaignSummaryCard,
  campaignSummaryOf,
} from '../../components/campaign-summary-card/campaign-summary-card';
import {
  CloseCampaignDialog,
  CloseCampaignDialogData,
  CloseCampaignDialogResult,
} from '../../components/close-campaign-dialog/close-campaign-dialog';

/**
 * "My campaigns": every campaign of the selected plot (`CampaignSummary` read
 * model). The producer closes the campaign in progress and starts a new one.
 */
@Component({
  selector: 'app-campaign-history-view',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    CampaignSummaryCard,
  ],
  templateUrl: './campaign-history-view.html',
  styleUrl: './campaign-history-view.css',
})
export class CampaignHistoryView {
  private readonly store = inject(FieldManagementStore);
  private readonly dialog = inject(MatDialog);

  // Store state
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly plot = this.store.selectedPlot;
  readonly campaigns = this.store.campaigns;

  /** `CampaignSummary` of every campaign of the selected plot, the most recent first. */
  readonly summaries = computed(() => {
    const plot = this.plot();
    if (!plot) return [];
    const ledgers = this.store.ledgersByCampaign();
    return [...this.campaigns()]
      .sort((a, b) => (b.id as number) - (a.id as number))
      .map((campaign) =>
        campaignSummaryOf(this.store, campaign, ledgers.get(campaign.id as number) ?? null, plot.areaHectares),
      );
  });
  readonly hasCampaignInProgress = this.store.hasCampaignInProgress;

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.my-plot', link: '/dashboard' },
    { label: 'field-management.campaigns.title' },
  ];

  /** Subtitle, e.g. "Pampa Alta · 3 campaigns". */
  readonly subtitleParams = computed(() => ({
    plot: this.plot()?.name ?? '',
    count: this.summaries().length,
  }));

  // Actions
  /** Asks for confirmation (and the harvested yield) before closing the campaign. */
  onClose(summary: CampaignSummary) {
    this.dialog
      .open<CloseCampaignDialog, CloseCampaignDialogData, CloseCampaignDialogResult>(CloseCampaignDialog, {
        data: { season: summary.season, yieldUnit: summary.yieldUnit, actualYield: summary.actualYield },
        width: 'calc(100vw - 32px)',
        maxWidth: '480px',
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        const actualYield =
          result.actualYield && summary.ledgerId !== null
            ? new RecordActualYieldCommand({
                ledgerId: summary.ledgerId,
                actualYield: result.actualYield,
                unit: summary.yieldUnit,
              })
            : undefined;
        this.store.closeCampaign(new CloseCropCampaignCommand({ campaignId: summary.campaignId }), actualYield);
      });
  }

  onExport(summary: CampaignSummary) {
    this.store.exportCostReport(new ExportCampaignCostReportCommand({ campaignId: summary.campaignId }));
  }
}
