import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfilesStore } from '../../../application/profiles.store';
import { InviteTechnicalAdvisorCommand } from '../../../domain/model/commands/invite-technical-advisor.command';
import { ReassignTechnicalAdvisorCommand } from '../../../domain/model/commands/reassign-technical-advisor.command';
import { UpdateCooperativeCommand } from '../../../domain/model/commands/update-cooperative.command';
import { TechnicalAdvisor } from '../../../domain/model/entities/technical-advisor.entity';
import { AdvisorDialog, AdvisorDialogData } from './components/advisor-dialog/advisor-dialog';
import {
  ConfirmDeleteDialog,
  ConfirmDeleteDialogData,
} from './components/confirm-delete-dialog/confirm-delete-dialog';

export type SettingsTab = 'cooperative' | 'technical-team';

/** Institutional configuration details for the cooperative director. */
@Component({
  selector: 'app-cooperative-settings',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './cooperative-settings.html',
  styleUrl: './cooperative-settings.css',
})
export class CooperativeSettings {
  private readonly store = inject(ProfilesStore);
  private readonly dialog = inject(MatDialog);
  private readonly session = inject(IamStore);

  readonly activeTab = signal<SettingsTab>('technical-team');
  readonly cooperative = this.store.cooperative;
  readonly technicalAdvisors = this.store.technicalAdvisors;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;

  readonly form = new FormGroup({
    legalName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    ruc: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{11}$/)],
    }),
    region: new FormControl('', { nonNullable: true, validators: Validators.required }),
    headquartersAddress: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    institutionalEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    switchboardPhone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(7)],
    }),
    legalRepresentative: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
  });

  constructor() {
    const activeUser = this.session.activeUser();

    if (activeUser?.experience === 'COOPERATIVE_DIRECTOR') {
      this.store.loadInstitutionalDashboard(activeUser.id);
    }

    effect(() => {
      const cooperative = this.cooperative();
      if (!cooperative) return;

      this.form.setValue(
        {
          legalName: cooperative.legalName,
          ruc: cooperative.ruc,
          region: cooperative.region,
          headquartersAddress: cooperative.headquartersAddress,
          institutionalEmail: cooperative.institutionalEmail,
          switchboardPhone: cooperative.switchboardPhone,
          legalRepresentative: cooperative.legalRepresentative,
        },
        { emitEvent: false },
      );
    });
  }

  selectTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  saveCooperative(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.saveCooperative(new UpdateCooperativeCommand(this.form.getRawValue()));
  }

  openInviteAdvisorDialog(): void {
    const cooperative = this.cooperative();
    const coopId =
      typeof cooperative?.id === 'number' ? cooperative.id : Number(cooperative?.id ?? 1);

    const dialogRef = this.dialog.open<AdvisorDialog, AdvisorDialogData>(AdvisorDialog, {
      width: '500px',
      data: { mode: 'invite' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.inviteTechnicalAdvisor(
          new InviteTechnicalAdvisorCommand(
            coopId,
            result.name,
            result.cipCode,
            result.phone,
            result.assignedPlotsCount,
          ),
        );
      }
    });
  }

  openReassignAdvisorDialog(advisor: TechnicalAdvisor): void {
    const dialogRef = this.dialog.open<AdvisorDialog, AdvisorDialogData>(AdvisorDialog, {
      width: '500px',
      data: { mode: 'reassign', advisor },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && advisor.id != null) {
        const advisorId = typeof advisor.id === 'number' ? advisor.id : Number(advisor.id);
        this.store.reassignTechnicalAdvisor(
          new ReassignTechnicalAdvisorCommand(
            advisorId,
            result.name,
            result.cipCode,
            result.phone,
            result.assignedPlotsCount,
          ),
        );
      }
    });
  }

  openRetirarAdvisorDialog(advisor: TechnicalAdvisor): void {
    if (advisor.id == null) return;
    const advisorId = typeof advisor.id === 'number' ? advisor.id : Number(advisor.id);

    const dialogRef = this.dialog.open<ConfirmDeleteDialog, ConfirmDeleteDialogData>(
      ConfirmDeleteDialog,
      {
        width: '440px',
        data: { advisorName: advisor.name },
      },
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.removeTechnicalAdvisor(advisorId);
      }
    });
  }
}
