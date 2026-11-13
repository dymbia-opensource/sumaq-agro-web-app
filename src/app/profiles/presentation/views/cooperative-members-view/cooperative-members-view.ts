import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { HarvestCertificationStore } from '../../../../harvest-certification/application/harvest-certification.store';
import { CooperativeMember } from '../../../domain/model/entities/cooperative-member.entity';
import { FieldManagementApi } from '../../../../field-management/infrastructure/field-management-api';
import { FieldPlot } from '../../../../field-management/domain/model/entities/field-plot.entity';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, finalize, map, of, startWith, switchMap } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ProfilesApi } from '../../../infrastructure/profiles-api';

@Component({
  selector: 'app-cooperative-members-view',
  imports: [DatePipe, DecimalPipe, MatTabsModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatProgressBarModule, RouterLink, TranslatePipe, PageHeader],
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
  private readonly editingMember = signal<CooperativeMember | null>(null);
  protected readonly editing = computed(() => {
    const member = this.editingMember();
    return member !== null && this.selected() === member;
  });

  protected editMember(member: CooperativeMember): void {
    this.error.set('');
    this.form.reset({
      fullName: member.fullName,
      dni: member.dni,
      phone: member.phone,
      community: member.community,
    });
    this.editingMember.set(member);
  }

  protected closeForm(): void {
    this.editingMember.set(null);
    this.adding.set(false);
    this.form.reset();
    this.error.set('');
  }
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  protected readonly memberId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });
  protected readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d][\d\s()-]{6,19}$/)]],
    community: ['', Validators.maxLength(100)],
  });

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
  protected readonly selected = computed(() => {
    const state = this.state();
    const id = this.memberId();
    if (state?.status !== 'ready' || id === null || state.directorId !== this.session.activeUser()?.id) return null;
    return state.members.find((member) => String(member.id) === id) ?? null;
  });

  private readonly fields = inject(FieldManagementApi);
  private readonly plotSelection = signal<{ memberId: string; options: FieldPlot[] } | null>(null);
  protected readonly plotOptions = computed(() => {
    const selection = this.plotSelection();
    return selection && selection.memberId === this.memberId() ? selection.options : null;
  });
  protected readonly plotError = signal(false);
  protected readonly linking = signal(false);

  protected loadPlots(): void {
    const member = this.selected();
    if (!member?.userId || this.linking()) return;
    this.plotError.set(false);
    this.linking.set(true);
    this.fields.getPlotsByOwner(member.userId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.linking.set(false)),
    ).subscribe({
      next: (plots) => {
        if (this.selected() !== member) return;
        this.plotSelection.set({
          memberId: String(member.id),
          options: plots.filter((plot) =>
            plot.hasPolygon() && !member.plots.some((linked) => linked.id === Number(plot.id)),
          ),
        });
      },
      error: () => this.plotError.set(true),
    });
  }

  protected linkPlot(plot: FieldPlot): void {
    const member = this.selected();
    const point = plot.boundary[0];
    if (!member || !point || this.linking() || !this.plotOptions()?.includes(plot)) return;
    this.plotError.set(false);
    this.linking.set(true);
    this.fields.getCampaignsByPlot(Number(plot.id)).pipe(
      switchMap((campaigns) => {
        if (this.selected() !== member) return of(null);
        const campaign = campaigns.find((item) => item.isActive());
        const cropType = campaign?.cropType;
        if (!campaign || (cropType !== 'ANDEAN_POTATO' && cropType !== 'SPECIALTY_COFFEE')) {
          this.plotError.set(true);
          return of(null);
        }
        return this.api.linkMemberPlot(member, {
          id: Number(plot.id),
          name: plot.name,
          region: plot.region,
          coordinates: point.latitude + ', ' + point.longitude,
          campaignId: Number(campaign.id),
          variety: campaign.seedVariety,
          cropType,
        });
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.linking.set(false)),
    ).subscribe({
      next: (updated) => {
        if (!updated || this.selected() !== member) return;
        this.plotSelection.set(null);
        this.retry();
      },
      error: () => this.plotError.set(true),
    });
  }

  protected readonly harvest = inject(HarvestCertificationStore);
  protected readonly memberBatches = computed(() => {
    const member = this.selected();
    if (!member || this.harvest.cooperativeId() !== member.cooperativeId) return [];

    return this.harvest.batches()
      .filter(({ data }) => data.memberId === member.id && data.cooperativeId === member.cooperativeId)
      .sort((a, b) => b.data.collectedAt.localeCompare(a.data.collectedAt));
  });

  protected readonly collectedKg = computed(() =>
    this.memberBatches().reduce((total, batch) => total + batch.netKg, 0),
  );

  protected readonly issuedCertificates = computed(() => {
    const batches = new Map(this.memberBatches().map((batch) => [batch.id, batch.data]));
    return this.harvest.certificates().flatMap(({ data }) => {
      const batch = batches.get(data.harvestBatchId);
      return batch ? [{ certificate: data, batch }] : [];
    }).sort((a, b) => b.certificate.issuedAt.localeCompare(a.certificate.issuedAt));
  });

  protected readonly visibleMembers = computed(() => {
    const state = this.state();
    if (state?.status !== 'ready' || state.directorId !== this.session.activeUser()?.id) return [];
    const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    const query = normalize(this.query().trim());
    return state.members.filter((member) => [member.fullName, member.dni, String(member.id)].some((value) => normalize(value).includes(query)));
  });

  protected save(): void {
    const state = this.state();
    if (state?.status !== 'ready' || state.directorId !== this.session.activeUser()?.id || this.saving()) return;
    const editing = this.editing() ? this.editingMember() : null;
    if (!editing && (!this.adding() || this.memberId() !== null)) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { fullName, dni, phone, community } = this.form.getRawValue();
    if (state.members.some((member) => member.dni === dni && member.id !== editing?.id)) {
      this.error.set('profiles.cooperative.members.duplicate');
      return;
    }
    this.error.set('');
    this.saving.set(true);
    const details = {
      fullName: fullName.trim(),
      dni,
      phone: phone.trim(),
      community: community.trim(),
    };
    const request = editing
      ? this.api.updateCooperativeMember(editing.id, details)
      : this.api.addCooperativeMember(state.cooperativeId, details);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: (member) => {
        if (state.directorId !== this.session.activeUser()?.id) return;
        this.closeForm();
        if (editing) {
          this.retry();
          return;
        }
        void this.router.navigate(['/profiles/cooperative/members', member.id], {
          state: { memberSearch: this.query() },
        });
      },
      error: () => this.error.set('profiles.cooperative.members.save-error'),
    });
  }

  protected retry(): void {
    this.refresh.update((value) => value + 1);
  }
}
