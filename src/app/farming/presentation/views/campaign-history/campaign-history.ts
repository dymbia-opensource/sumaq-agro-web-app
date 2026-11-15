import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import {
  Breadcrumb,
  PageHeader,
} from '../../../../shared/presentation/components/page-header/page-header';
import { CampaignForm, CampaignFormData } from '../../components/campaign-form/campaign-form';
import { FarmingStore } from '../../../application/farming.store';
import { CloseCropCampaignCommand } from '../../../domain/model/commands/close-crop-campaign.command';
import {
  CampaignSummary,
  CampaignSummaryCard,
  campaignSummaryOf,
} from '../../components/campaign-summary-card/campaign-summary-card';
import {
  CloseCampaignDialog,
  CloseCampaignDialogData,
} from '../../components/close-campaign-dialog/close-campaign-dialog';

/**
 * "My campaigns": every campaign of the selected plot (`CampaignSummary` read
 * model). The producer closes the campaign in progress and starts a new one.
 */
@Component({
  selector: 'app-campaign-history',
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
    CampaignForm,
  ],
  templateUrl: './campaign-history.html',
  styleUrl: './campaign-history.css',
})
export class CampaignHistory {
  private readonly store = inject(FarmingStore);
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
        campaignSummaryOf(
          this.store,
          campaign,
          ledgers.get(campaign.id as number) ?? null,
          plot.areaHectares,
        ),
      );
  });
  readonly hasCampaignInProgress = this.store.hasCampaignInProgress;

  readonly editId = signal<number | null>(null);
  readonly editingCampaign = computed(() =>
    this.campaigns().find((campaign) => campaign.id === this.editId() && campaign.isActive()),
  );

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [{ label: 'farming.campaigns.title' }];

  /** Subtitle, e.g. "Pampa Alta · 3 campaigns". */
  readonly subtitleParams = computed(() => ({
    plot: this.plot()?.name ?? '',
    count: this.summaries().length,
  }));

  onEdit(summary: CampaignSummary): void {
    this.editId.set(summary.campaignId);
  }

  onSave(data: CampaignFormData): void {
    const current = this.editingCampaign();
    if (!current) return;
    this.store.updateCampaign(
      Number(current.id),
      {
        cropType: data.cropType,
        seedVariety: data.seedVariety,
        customSeedVariety: data.customVariety,
        sowingDate:
          data.sowingDate?.getTime() === current.sowingDate?.getTime() ? null : data.sowingDate,
      },
      () => this.editId.set(null),
    );
  }

  onClose(summary: CampaignSummary): void {
    this.dialog
      .open<CloseCampaignDialog, CloseCampaignDialogData, boolean>(CloseCampaignDialog, {
        data: { season: summary.season },
        width: 'calc(100vw - 32px)',
        maxWidth: '480px',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.closeCampaign(
            new CloseCropCampaignCommand({ campaignId: summary.campaignId }),
          );
        }
      });
  }
}
