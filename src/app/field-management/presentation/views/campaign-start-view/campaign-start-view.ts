import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { FieldManagementStore } from '../../../application/field-management.store';
import { RecordSowingDateCommand } from '../../../domain/model/commands/record-sowing-date.command';
import { SelectCropTypeCommand } from '../../../domain/model/commands/select-crop-type.command';
import { SetExpectedYieldCommand } from '../../../domain/model/commands/set-expected-yield.command';
import { SpecifySeedVarietyCommand } from '../../../domain/model/commands/specify-seed-variety.command';
import { StartCropCampaignCommand } from '../../../domain/model/commands/start-crop-campaign.command';
import { CropType } from '../../../domain/model/entities/crop-campaign.entity';
import { CampaignForm, CampaignFormData } from '../../components/campaign-form/campaign-form';

const CAMPAIGNS_ROUTE = '/campaigns';

/**
 * Starts a new campaign on the selected plot once the previous one is closed
 * (`StartCropCampaign`, `SelectCropType`, `SpecifySeedVariety`, `RecordSowingDate`).
 */
@Component({
  selector: 'app-campaign-start-view',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    CampaignForm,
  ],
  templateUrl: './campaign-start-view.html',
  styleUrl: './campaign-start-view.css',
})
export class CampaignStartView {
  private readonly router = inject(Router);
  private readonly store = inject(FieldManagementStore);

  // Store state
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly plot = this.store.selectedPlot;
  readonly hasCampaignInProgress = this.store.hasCampaignInProgress;

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.my-plot', link: '/dashboard' },
    { label: 'field-management.campaigns.title', link: CAMPAIGNS_ROUTE },
    { label: 'field-management.campaigns.new' },
  ];

  /** The new campaign suggests the crop of the previous one. */
  readonly previousCropType = computed(() => this.store.activeCampaign()?.cropType ?? CropType.ANDEAN_POTATO);

  // Actions
  /** Turns the form data into domain commands and sends them to the store. */
  onStart(data: CampaignFormData) {
    const plotId = this.plot()?.id as number;
    this.store.startCampaign(
      {
        start: new StartCropCampaignCommand({ plotId, season: data.season }),
        cropType: new SelectCropTypeCommand({ campaignId: 0, cropType: data.cropType }),
        seedVariety: new SpecifySeedVarietyCommand({
          campaignId: 0,
          varietyName: data.seedVariety,
          custom: data.customVariety,
        }),
        sowingDate: new RecordSowingDateCommand({ campaignId: 0, sowingDate: data.sowingDate }),
        expectedYield: data.expectedYield
          ? new SetExpectedYieldCommand({ ledgerId: 0, expectedYield: data.expectedYield, unit: data.yieldUnit })
          : undefined,
      },
      () => this.onCancel(),
    );
  }

  onCancel() {
    this.router.navigate([CAMPAIGNS_ROUTE]).then();
  }
}
