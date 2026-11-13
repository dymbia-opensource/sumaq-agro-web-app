import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CooperativeMember } from '../../../domain/model/entities/cooperative-member.entity';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, finalize, map, of, startWith, switchMap } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ProfilesApi } from '../../../infrastructure/profiles-api';

@Component({
  selector: 'app-cooperative-members-view',
  imports: [ReactiveFormsModule, MatIconModule, MatButtonModule, MatProgressBarModule, RouterLink, TranslatePipe, PageHeader],
  templateUrl: './cooperative-members-view.html',
  styleUrl: './cooperative-members-view.css',
})
export class CooperativeMembersView {
  private readonly api = inject(ProfilesApi);
  private readonly session = inject(IamStore);
  private readonly refresh = signal(0);
  private readonly request = computed(() => ({
    user: this.session.activeUser(),
    refresh: this.refresh(),
  }));

  private readonly destroyRef = inject(DestroyRef);
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly selected = signal<CooperativeMember | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d][\d\s()-]{6,19}$/)]],
    community: ['', Validators.maxLength(100)],
  });

  protected readonly query = signal('');
  protected readonly state = toSignal(toObservable(this.request).pipe(
    switchMap(({ user }) => {
      if (user?.experience !== 'COOPERATIVE_DIRECTOR') return of({ status: 'idle' } as const);
      return this.api.getCooperativeByDirector(user.id).pipe(
        switchMap((cooperative) => cooperative
          ? this.api.getCooperativeMembers(Number(cooperative.id)).pipe(
              map((members) => ({ status: 'ready', members, cooperativeId: Number(cooperative.id), directorId: user.id } as const)),
            )
          : of({ status: 'no-cooperative' } as const)),
        startWith({ status: 'loading' } as const),
        catchError(() => of({ status: 'error' } as const)),
      );
    }),
  ));
  protected readonly visibleMembers = computed(() => {
    const state = this.state();
    if (state?.status !== 'ready') return [];
    const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    const query = normalize(this.query().trim());
    return state.members.filter((member) => [member.fullName, member.dni, String(member.id)].some((value) => normalize(value).includes(query)));
  });

  protected save(): void {
    const state = this.state();
    if (state?.status !== 'ready' || state.directorId !== this.session.activeUser()?.id || this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { fullName, dni, phone, community } = this.form.getRawValue();
    if (state.members.some((member) => member.dni === dni)) {
      this.error.set('profiles.cooperative.members.duplicate');
      return;
    }
    this.error.set('');
    this.saving.set(true);
    this.api.addCooperativeMember(state.cooperativeId, {
      fullName: fullName.trim(),
      dni,
      phone: phone.trim(),
      community: community.trim(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: () => {
        this.adding.set(false);
        this.form.reset();
        this.query.set('');
        this.retry();
      },
      error: () => this.error.set('profiles.cooperative.members.save-error'),
    });
  }

  protected retry(): void {
    this.refresh.update((value) => value + 1);
  }
}
