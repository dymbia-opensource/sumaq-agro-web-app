import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { FieldManagementStore } from '../../../application/field-management.store';
import { ExportCampaignCostReportCommand } from '../../../domain/model/commands/export-campaign-cost-report.command';
import { RecordActualYieldCommand } from '../../../domain/model/commands/record-actual-yield.command';
import { ActualYieldCard } from '../../components/actual-yield-card/actual-yield-card';
import { BreakevenReportCard } from '../../components/breakeven-report-card/breakeven-report-card';
import { CostPerHectareCard } from '../../components/cost-per-hectare-card/cost-per-hectare-card';

/**
 * "Cost reports" of the active campaign: `BreakevenReport` and
 * `CostPerHectareReport`, the harvested yield and the export of the report.
 */
@Component({
  selector: 'app-cost-reports-view',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    BreakevenReportCard,
    CostPerHectareCard,
    ActualYieldCard,
  ],
  templateUrl: './cost-reports-view.html',
  styleUrl: './cost-reports-view.css',
})
export class CostReportsView {
  private readonly store = inject(FieldManagementStore);

  // Store state
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly plot = this.store.selectedPlot;
  readonly campaign = this.store.activeCampaign;
  readonly ledger = this.store.ledger;

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.my-plot', link: '/dashboard' },
    { label: 'option.expenses', link: '/field-management/finances' },
    { label: 'field-management.reports.title' },
  ];

  readonly subtitleParams = computed(() => ({
    plot: this.plot()?.name ?? '',
    season: this.campaign()?.season ?? '',
  }));

  // Actions
  onActualYieldChange(actualYield: number) {
    const ledger = this.ledger();
    if (!ledger) return;
    this.store.recordActualYield(
      new RecordActualYieldCommand({ ledgerId: ledger.id as number, actualYield, unit: ledger.yieldUnit }),
    );
  }

  onExport() {
    const campaign = this.campaign();
    if (!campaign) return;
    this.store.exportCostReport(new ExportCampaignCostReportCommand({ campaignId: campaign.id as number }));
  }
}
