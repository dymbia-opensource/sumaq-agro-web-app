import { CooperativeMember } from '../../../domain/model/entities/cooperative-member.entity';
import { FarmingStore } from '../../../../farming/application/farming.store';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, finalize, map, of, startWith, switchMap } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { PlotAdvisorAssignment } from '../../components/plot-advisor-assignment/plot-advisor-assignment';
import { ProfilesApi } from '../../../infrastructure/profiles-api';
import { ProfilesStore } from '../../../application/profiles.store';
import { MemberCandidate } from '../../../domain/model/entities/member-candidate';

@Component({
  selector: 'app-cooperative-members',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatButtonToggleModule,
    RouterLink,
    TranslatePipe,
    PageHeader,
    PlotAdvisorAssignment,
  ],
  templateUrl: './cooperative-members.html',
  styleUrl: './cooperative-members.css',
})
export class CooperativeMembers {
  /** Breadcrumb of the record of one member, a subpage of the member directory. */
  protected readonly dossierBreadcrumbs: Breadcrumb[] = [
    { label: 'option.member-directory', link: '/cooperative/members' },
    { label: 'profiles.cooperative.members.dossier' },
  ];

  private readonly api = inject(ProfilesApi);
  private readonly store = inject(ProfilesStore);
  private readonly session = inject(IamStore);
  private readonly refresh = signal(0);
  private readonly request = computed(() => ({
    user: this.session.activeUser(),
    refresh: this.refresh(),
  }));

  private readonly destroyRef = inject(DestroyRef);
  protected readonly adding = signal(false);
  protected closeForm(): void {
    this.adding.set(false);
    this.form.reset();
    this.error.set('');
    this.candidate.set(null);
    this.lookupResult.set(null);
  }
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  protected readonly memberId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    {
      initialValue: this.route.snapshot.paramMap.get('id'),
    },
  );
  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    // Email of the producer account: the director looks it up instead of typing its data.
    email: ['', [Validators.email, Validators.maxLength(150)]],
    community: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
  });

  /** Producer account found by email; the member is linked to it when he is saved. */
  protected readonly candidate = signal<MemberCandidate | null>(null);
  /** Outcome of the last lookup, shown under the email field. */
  protected readonly lookupResult = signal<'found' | 'not-found' | 'already-member' | 'error' | null>(
    null,
  );
  protected readonly lookingUp = signal(false);

  constructor() {
    // A different email needs a new lookup.
    this.form.controls.email.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.candidate() || this.lookupResult()) {
        this.candidate.set(null);
        this.lookupResult.set(null);
      }
    });
  }

  /** Looks up the producer account of the email and fills the form with its profile. */
  protected lookUp(): void {
    const state = this.state();
    const email = this.form.controls.email.value.trim();
    if (state?.status !== 'ready' || !email || this.form.controls.email.invalid || this.lookingUp())
      return;
    this.lookingUp.set(true);
    this.store
      .findMemberCandidate(state.cooperativeId, email)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.lookingUp.set(false)),
      )
      .subscribe({
        next: (candidate) => {
          if (!candidate) {
            this.lookupResult.set('not-found');
            return;
          }
          if (candidate.alreadyMember) {
            this.lookupResult.set('already-member');
            return;
          }
          this.form.patchValue(
            {
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              ...(candidate.dni ? { dni: candidate.dni } : {}),
            },
            { emitEvent: false },
          );
          this.candidate.set(candidate);
          this.lookupResult.set('found');
        },
        error: () => this.lookupResult.set('error'),
      });
  }

  /** Email typed in the record of a member without account. */
  protected readonly linkEmail = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email, Validators.maxLength(150)],
  });
  protected readonly linking = signal(false);
  protected readonly linkError = signal('');

  /** Links the member to the producer account of the typed email. */
  protected linkAccount(memberId: number, cooperativeId: number): void {
    this.linkEmail.markAsTouched();
    if (this.linkEmail.invalid || this.linking()) return;
    this.linking.set(true);
    this.linkError.set('');
    this.store
      .linkMemberAccount(cooperativeId, memberId, this.linkEmail.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.linking.set(false)),
      )
      .subscribe({
        next: () => {
          this.linkEmail.reset();
          this.retry();
        },
        error: (reason: unknown) => this.linkError.set(CooperativeMembers.accountError(reason)),
      });
  }

  /** Message of a failed link to an account. */
  private static accountError(reason: unknown): string {
    if (reason instanceof HttpErrorResponse) {
      if (reason.status === 422) return 'profiles.cooperative.members.account-not-found';
      if (reason.status === 409) return 'profiles.cooperative.members.already-linked';
      if (reason.status === 400) return 'profiles.cooperative.members.account-in-use';
    }
    return 'profiles.cooperative.members.save-error';
  }

  protected readonly query = signal(this.readSearch());

  private readSearch(): string {
    const state = this.location.getState() as { memberSearch?: unknown } | null;
    return typeof state?.memberSearch === 'string' ? state.memberSearch : '';
  }

  protected search(value: string): void {
    this.query.set(value);
    this.location.replaceState(this.router.url, '', {
      ...(this.location.getState() as object),
      memberSearch: value,
    });
  }
  protected readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ user }) => {
        if (user?.experience !== 'COOPERATIVE_DIRECTOR') return of({ status: 'idle' } as const);
        return this.api.getCooperativeByDirector(user.id).pipe(
          switchMap((cooperative) =>
            cooperative
              ? this.api.getCooperativeMembers(Number(cooperative.id)).pipe(
                  map(
                    (members) =>
                      ({
                        status: 'ready',
                        members,
                        cooperativeId: Number(cooperative.id),
                        directorId: user.id,
                      }) as const,
                  ),
                )
              : of({ status: 'no-cooperative' } as const),
          ),
          startWith({ status: 'loading' } as const),
          catchError(() => of({ status: 'error' } as const)),
        );
      }),
    ),
  );
  protected readonly selected = computed(() => {
    const state = this.state();
    const id = this.memberId();
    if (
      state?.status !== 'ready' ||
      id === null ||
      state.directorId !== this.session.activeUser()?.id
    )
      return null;
    return state.members.find((member) => String(member.id) === id) ?? null;
  });

  /** Columns of the member table, in display order. */
  protected readonly columns: string[] = ['member', 'dni', 'status', 'actions'];

  protected readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  protected readonly filters = [
    { value: 'all', label: 'profiles.cooperative.members.filter-all' },
    { value: 'active', label: 'profiles.cooperative.members.active' },
    { value: 'inactive', label: 'profiles.cooperative.members.inactive' },
  ] as const;

  /** Summary shown above the member table; null when there is nothing to summarize. */
  protected readonly stats = computed(() => {
    const state = this.state();
    if (state?.status !== 'ready' || state.members.length === 0) return null;
    return {
      total: state.members.length,
      active: state.members.filter((member) => member.active).length,
    };
  });

  protected initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private readonly fields = inject(FarmingStore);
  protected readonly memberPlots = toSignal(
    toObservable(this.selected).pipe(
      switchMap((member) =>
        !member?.active || member.userId === null
          ? of({ status: 'ready' as const, plots: [] })
          : this.fields.plotSummariesByOwner(member.userId).pipe(
              map((plots) => ({ status: 'ready' as const, plots })),
              startWith({ status: 'loading' as const, plots: [] }),
              catchError(() => of({ status: 'error' as const, plots: [] })),
            ),
      ),
    ),
  );

  protected readonly visibleMembers = computed(() => {
    const state = this.state();
    if (state?.status !== 'ready' || state.directorId !== this.session.activeUser()?.id) return [];
    const normalize = (value: string) =>
      value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    const query = normalize(this.query().trim());
    const status = this.statusFilter();
    return state.members.filter(
      (member) =>
        (status === 'all' || member.active === (status === 'active')) &&
        [member.fullName, member.dni, String(member.id)].some((value) =>
          normalize(value).includes(query),
        ),
    );
  });

  protected save(): void {
    const state = this.state();
    if (
      state?.status !== 'ready' ||
      state.directorId !== this.session.activeUser()?.id ||
      this.saving()
    )
      return;
    if (!this.adding() || this.memberId() !== null) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { firstName, lastName, dni, community } = this.form.getRawValue();
    const candidate = this.candidate();
    if (state.members.some((member) => member.dni === dni)) {
      this.error.set('profiles.cooperative.members.duplicate');
      return;
    }
    this.error.set('');
    this.saving.set(true);
    this.store
      .addMember(state.cooperativeId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dni,
        community: community.trim(),
        // Only an account found by the lookup is linked.
        ...(candidate ? { email: candidate.email } : {}),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (member) => {
          if (state.directorId !== this.session.activeUser()?.id) return;
          this.closeForm();
          void this.router.navigate(['/cooperative/members', member.id], {
            state: { memberSearch: this.query() },
          });
        },
        error: (reason: unknown) => this.error.set(CooperativeMembers.accountError(reason)),
      });
  }

  protected retry(): void {
    this.refresh.update((value) => value + 1);
  }
}
