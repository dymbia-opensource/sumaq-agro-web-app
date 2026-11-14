import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfilesStore } from '../../../application/profiles.store';
import { UpdateFarmerAccountCommand } from '../../../domain/model/commands/update-farmer-account.command';

/** Account settings view for the independent farmer (segment 1). */
@Component({
  selector: 'app-farmer-settings-view',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatSelectModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './farmer-settings-view.html',
  styleUrl: './farmer-settings-view.css',
})
export class FarmerSettingsView {
  private readonly store = inject(ProfilesStore);
  private readonly snackBar = inject(MatSnackBar);
  readonly session = inject(IamStore);
  readonly translate = inject(TranslateService);
  readonly tab = signal<'account' | 'help'>('account');
  readonly search = signal('');
  readonly editing = signal(false);
  readonly guideIds = [
    'plots',
    'campaigns',
    'expenses',
    'health',
    'certificates',
    'offline',
  ] as const;
  readonly faqs = ['connection', 'contact', 'alerts'] as const;
  readonly destinations: Record<string, string> = {
    plots: '/plots',
    campaigns: '/campaigns',
    expenses: '/finances',
    health: '/monitoring',
    certificates: '/certificates',
    offline: '/finances',
  };
  readonly icons: Record<string, string> = {
    plots: 'map',
    campaigns: 'grass',
    expenses: 'payments',
    health: 'monitor_heart',
    certificates: 'verified',
    offline: 'sync',
  };
  readonly filteredGuides = computed(() => {
    this.translate.currentLang();
    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const query = normalize(this.search().trim());
    return this.guideIds.filter((id) =>
      normalize(
        this.translate.instant('profiles.settings.guides.' + id + '.title') +
          ' ' +
          this.translate.instant('profiles.settings.guides.' + id + '.summary') +
          ' ' +
          String(this.translate.instant('profiles.settings.guides.' + id + '.steps')),
      ).includes(query),
    );
  });

  readonly profile = this.store.profile;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;

  readonly contactForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(7)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  constructor() {
    const userId = this.session.activeUser()?.id;
    if (userId !== undefined) {
      this.store.loadFarmerProfile(userId);
    }
    effect(() => {
      if (this.store.contactSaved()) {
        this.editing.set(false);
        this.contactForm.markAsPristine();
        untracked(() =>
          this.snackBar.open(this.translate.instant('profiles.settings.saved'), undefined, {
            duration: 3000,
          }),
        );
      }
    });
    effect(() => {
      const profile = this.profile();
      if (profile) {
        this.contactForm.setValue(
          {
            firstName: profile.firstName,
            lastName: profile.lastName,
            phoneNumber: profile.phoneNumber,
            email: profile.email,
          },
          { emitEvent: false },
        );
      }
    });
  }

  startEditing(): void {
    if (!this.profile() || this.loading() || this.saving()) return;
    this.store.clearContactFeedback();
    this.editing.set(true);
  }

  cancelEditing(): void {
    if (this.saving()) return;
    const profile = this.profile();
    if (profile)
      this.contactForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        email: profile.email,
      });
    this.editing.set(false);
  }

  saveContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    if (!this.editing() || this.saving() || this.loading() || !this.profile()) return;
    this.store.saveAccount(new UpdateFarmerAccountCommand(this.contactForm.getRawValue()));
  }
}
