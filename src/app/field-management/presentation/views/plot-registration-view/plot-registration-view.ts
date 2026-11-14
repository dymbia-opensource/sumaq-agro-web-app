import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  Breadcrumb,
  PageHeader,
} from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { FieldManagementStore } from '../../../application/field-management.store';
import { RecordSowingDateCommand } from '../../../domain/model/commands/record-sowing-date.command';
import { RegisterFieldPlotCommand } from '../../../domain/model/commands/register-field-plot.command';
import { SelectCropTypeCommand } from '../../../domain/model/commands/select-crop-type.command';
import { SetExpectedYieldCommand } from '../../../domain/model/commands/set-expected-yield.command';
import { SpecifySeedVarietyCommand } from '../../../domain/model/commands/specify-seed-variety.command';
import { StartCropCampaignCommand } from '../../../domain/model/commands/start-crop-campaign.command';
import { CropCampaign } from '../../../domain/model/entities/crop-campaign.entity';
import {
  PlotRegistrationData,
  PlotRegistrationForm,
} from '../../components/plot-registration-form/plot-registration-form';
import { RegistrationSteps } from '../../components/registration-steps/registration-steps';

/** Step 1 of 2: registers the plot and its first campaign, then opens the map (US-28, US-32 to US-34, US-40). */
@Component({
  selector: 'app-plot-registration-view',
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    RegistrationSteps,
    PlotRegistrationForm,
  ],
  templateUrl: './plot-registration-view.html',
  styleUrl: './plot-registration-view.css',
})
export class PlotRegistrationView {
  private router = inject(Router);
  private fieldManagementStore = inject(FieldManagementStore);

  // Store state
  readonly loading = this.fieldManagementStore.loading;
  readonly error = this.fieldManagementStore.error;
  readonly canRegisterPlot = this.fieldManagementStore.canRegisterPlot;
  readonly plotQuotaReady = this.fieldManagementStore.plotQuotaReady;
  readonly plotQuotaReached = this.fieldManagementStore.plotQuotaReached;
  readonly registrationIncomplete = this.fieldManagementStore.registrationIncomplete;
  readonly plotQuota = this.fieldManagementStore.plotQuota;

  // UI state
  /** Slot the new plot will use, e.g. 3 when 2 plots exist. */
  readonly slotNumber = computed(() => this.fieldManagementStore.plotCount() + 1);

  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.my-plot', link: '/dashboard' },
    { label: 'field-management.plots.manage', link: '/plots' },
    { label: 'field-management.steps.crop-data' },
  ];

  // Actions
  /** Turns the form data into domain commands and sends them to the store. */
  onRegister(data: PlotRegistrationData) {
    const ownerUserId = this.fieldManagementStore.currentUserId();
    if (ownerUserId === null) return;

    const command = new RegisterFieldPlotCommand({
      ownerUserId,
      name: data.name,
      region: data.region,
      declaredAreaHectares: data.declaredAreaHectares,
    });

    this.fieldManagementStore.registerPlot(
      command,
      {
        start: new StartCropCampaignCommand({
          plotId: 0,
          season: this.fieldManagementStore.seasonOf(data.sowingDate),
        }),
        cropType: new SelectCropTypeCommand({ campaignId: 0, cropType: data.cropType }),
        seedVariety: new SpecifySeedVarietyCommand({
          campaignId: 0,
          varietyName: data.seedVariety,
          custom: data.customVariety,
        }),
        sowingDate: new RecordSowingDateCommand({ campaignId: 0, sowingDate: data.sowingDate }),
        expectedYield: data.expectedYield
          ? new SetExpectedYieldCommand({
              ledgerId: 0,
              expectedYield: data.expectedYield,
              unit: data.yieldUnit,
            })
          : undefined,
      },
      (plot) => this.router.navigate(['/plots', plot.id, 'boundary']).then(),
    );
  }

  onCancel() {
    this.router.navigate(['/plots']).then();
  }
}
