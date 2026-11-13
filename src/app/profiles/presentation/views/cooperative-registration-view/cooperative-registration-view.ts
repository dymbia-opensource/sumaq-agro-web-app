import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ProfilesApi } from '../../../infrastructure/profiles-api';

@Component({
  selector: 'app-cooperative-registration-view',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink, TranslatePipe, PageHeader],
  templateUrl: './cooperative-registration-view.html',
  styleUrl: './cooperative-registration-view.css',
})
export class CooperativeRegistrationView {
  private readonly api = inject(ProfilesApi);
  private readonly session = inject(IamStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly form = inject(FormBuilder).nonNullable.group({
    legalName: ['', [Validators.required, Validators.pattern(/\S/)]],
    ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    region: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  protected submit(): void {
    const director = this.session.activeUser();
    if (this.saving() || director?.experience !== 'COOPERATIVE_DIRECTOR') return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { legalName, ruc, region } = this.form.getRawValue();
    this.error.set('');
    this.saving.set(true);
    this.api.getCooperativeByDirector(director.id).pipe(
      switchMap((existing) => {
        if (this.session.activeUser()?.id !== director.id) return EMPTY;
        if (existing) {
          this.error.set('profiles.cooperative.registration.existing');
          return EMPTY;
        }
        return this.api.registerCooperative(director.id, legalName.trim(), ruc, region.trim());
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: () => {
        if (this.session.activeUser()?.id === director.id) {
          void this.router.navigate(['/profiles/cooperative/dashboard']);
        }
      },
      error: () => this.error.set('profiles.cooperative.registration.error'),
    });
  }
}
