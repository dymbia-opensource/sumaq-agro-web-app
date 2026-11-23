import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfilesStore } from '../../../application/profiles.store';
import { UpdateCooperativeCommand } from '../../../domain/model/commands/update-cooperative.command';

export type SettingsTab = 'cooperative' | 'technical-team';

/** Institutional configuration details for the cooperative director. */
@Component({
  selector: 'app-cooperative-settings',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    TranslatePipe,
    MatFormFieldModule,
      MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './cooperative-settings.html',
  styleUrl: './cooperative-settings.css',
})
export class CooperativeSettings {
  private readonly store = inject(ProfilesStore);
  private readonly session = inject(IamStore);

  readonly activeTab = signal<SettingsTab>('cooperative');
  readonly cooperative = this.store.cooperative;
  readonly technicalAdvisors = this.store.technicalAdvisors;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;

  readonly invitationEmail = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email, Validators.maxLength(150)],
  });
  readonly invitationBusy = signal(false);
  readonly invitationFeedback = signal('');

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

  invite(): void {
    if (this.invitationEmail.invalid || this.invitationBusy() || !this.cooperative()) return;
    this.invitationBusy.set(true);
    this.invitationFeedback.set('');
    this.store.inviteAgronomist(this.invitationEmail.value.trim()).subscribe({
      next: () => {
        this.invitationEmail.reset();
        this.invitationFeedback.set('profiles.cooperative.integration.invitation-created');
        this.invitationBusy.set(false);
      },
      error: () => {
        this.invitationFeedback.set('profiles.cooperative.integration.invitation-error');
        this.invitationBusy.set(false);
      },
    });
  }
}
