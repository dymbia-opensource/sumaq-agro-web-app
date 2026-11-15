import { UpdateFarmerAccountCommand } from '../domain/model/commands/update-farmer-account.command';
import { computed, DestroyRef, effect, inject, Injectable, Injector, signal, untracked } from '@angular/core';
import {
  catchError,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  throwError,
} from 'rxjs';
import { FarmingStore } from '../../farming/application/farming.store';
import { IamStore, SessionParticipant } from '../../iam/application/iam.store';
import { UpdateCooperativeCommand } from '../domain/model/commands/update-cooperative.command';
import { CooperativeMember } from '../domain/model/entities/cooperative-member.entity';
import { Cooperative } from '../domain/model/entities/cooperative.entity';
import { FarmerProfile } from '../domain/model/entities/farmer-profile.entity';
import { TechnicalAdvisor } from '../domain/model/entities/technical-advisor.entity';
import { AdvisorSummary } from '../domain/model/entities/advisor-summary';
import { PlotAdvisorAssignment } from '../domain/model/entities/plot-advisor-assignment';
import { PlotResponsibility } from '../domain/model/entities/plot-responsibility';
import { ProfilesApi } from '../infrastructure/profiles-api';

/** Coordinates the institutional Profile read models for a cooperative director. */
@Injectable({ providedIn: 'root' })
export class ProfilesStore {
  private readonly injector = inject(Injector);
  private readonly profilesApi = inject(ProfilesApi);
  private readonly session = inject(IamStore);
  private readonly profileSignal = signal<FarmerProfile | null>(null);
  private readonly cooperativeSignal = signal<Cooperative | null>(null);
  private readonly membersSignal = signal<CooperativeMember[]>([]);
  private readonly technicalAdvisorsSignal = signal<TechnicalAdvisor[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  private readonly contactSavedSignal = signal(false);
  readonly contactSaved = this.contactSavedSignal.asReadonly();
  readonly profile = this.profileSignal.asReadonly();
  readonly cooperative = this.cooperativeSignal.asReadonly();
  readonly members = this.membersSignal.asReadonly();
  readonly technicalAdvisors = this.technicalAdvisorsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly activeMemberCount = computed(
    () => this.members().filter((member) => member.active).length,
  );

  constructor() {
    effect(() => {
      this.session.activeUser();
      untracked(() => this.reloadAdvisory());
    });
    inject(DestroyRef).onDestroy(() => this.advisoryRequests.unsubscribe());
  }

  clearContactFeedback(): void {
    this.contactSavedSignal.set(false);
    this.errorSignal.set(null);
  }

  /** Loads the personal contact profile of the independent farmer. */
  loadFarmerProfile(userId: number): void {
    this.contactSavedSignal.set(false);
    this.profileSignal.set(null);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .getFarmerProfile(userId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (profile) => this.profileSignal.set(profile),
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  /** Saves the farmer's editable profile fields. */
  saveAccount(command: UpdateFarmerAccountCommand): void {
    this.contactSavedSignal.set(false);
    const current = this.profileSignal();
    if (!current || this.saving()) return;
    const profile = new FarmerProfile({
      id: current.id as number,
      userId: current.userId,
      firstName: current.firstName,
      lastName: current.lastName,
      phoneNumber: current.phoneNumber,
      email: current.email,
    });

    try {
      profile.updateName(command.firstName, command.lastName);
      profile.updatePhoneNumber(command.phoneNumber);
    } catch (error) {
      this.errorSignal.set(error instanceof Error ? error.message : 'Invalid contact data.');
      return;
    }

    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .updateFarmerProfile(profile)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: (updatedProfile) => {
          this.profileSignal.set(updatedProfile);
          this.contactSavedSignal.set(true);
        },
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  /** Loads the director's cooperative, members and assigned agronomists. */
  loadInstitutionalDashboard(directorUserId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.cooperativeSignal.set(null);
    this.membersSignal.set([]);
    this.technicalAdvisorsSignal.set([]);
    this.profilesApi.getCooperativeByDirector(directorUserId).pipe(
      switchMap((cooperative) => {
        this.cooperativeSignal.set(cooperative);
        if (!cooperative) return of({ members: [], advisors: [] });
        const id = Number(cooperative.id);
        return forkJoin({
          members: this.profilesApi.getCooperativeMembers(id),
          advisors: this.profilesApi.getAssignmentsByCooperative(id).pipe(
            switchMap((assignments) => this.assignedAdvisors(assignments, id)),
          ),
        });
      }),
      finalize(() => this.loadingSignal.set(false)),
    ).subscribe({
      next: ({ members, advisors }) => {
        this.membersSignal.set(members);
        this.technicalAdvisorsSignal.set(advisors);
      },
      error: (error: Error) => this.errorSignal.set(error.message),
    });
  }

  private assignedAdvisors(assignments: PlotAdvisorAssignment[], cooperativeId = 0): Observable<TechnicalAdvisor[]> {
    const active = assignments.filter((assignment) => assignment.status === 'ACTIVE');
    const ids = [...new Set(active.map((assignment) => assignment.advisorUserId))];
    if (!ids.length) return of([]);
    return forkJoin(ids.map((userId) =>
      this.advisorByUser(userId).pipe(
        map((advisor) => new TechnicalAdvisor({
          id: userId,
          userId,
          cooperativeId,
          name: advisor?.name || '#' + userId,
          cipCode: '',
          phone: '',
          assignedPlotsCount: active.filter((assignment) => assignment.advisorUserId === userId).length,
        })),
      ),
    ));
  }

  inviteAgronomist(email: string): Observable<unknown> {
    const cooperative = this.cooperative();
    if (!cooperative || cooperative.directorUserId !== this.session.activeUser()?.id) {
      return throwError(() => new Error('profiles.advisory.errors.denied'));
    }
    return this.profilesApi.inviteAgronomist(Number(cooperative.id), email);
  }

  /** Validates and persists the director's institutional configuration. */
  saveCooperative(command: UpdateCooperativeCommand): void {
    const current = this.cooperativeSignal();
    if (!current || this.saving()) return;
    const cooperative = new Cooperative({
      id: Number(current.id), directorUserId: current.directorUserId,
      legalName: current.legalName, ruc: current.ruc, region: current.region,
      institutionalEmail: current.institutionalEmail, legalRepresentative: current.legalRepresentative,
      headquartersAddress: current.headquartersAddress, switchboardPhone: current.switchboardPhone,
    });

    try {
      cooperative.updateInstitutionalData(command);
    } catch (error) {
      this.errorSignal.set(error instanceof Error ? error.message : 'Invalid institutional data.');
      return;
    }

    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .updateCooperative(cooperative)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: (updatedCooperative) => this.cooperativeSignal.set(updatedCooperative),
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  // ---------- Published reads for the other bounded contexts ----------

  /**
   * Publishes the professional linked to an account.
   * @param userId - Account of the professional.
   */
  advisorByUser(userId: number): Observable<AdvisorSummary | null> {
    return this.profilesApi.getFarmerProfile(userId).pipe(
      map((profile) => ({ userId, name: profile.fullName || '#' + userId })),
      catchError(() => of(null)),
    );
  }

  /**
   * Publishes the cooperative of a director.
   * @param userId - Account of the director.
   */
  cooperativeByDirector(userId: number): Observable<{ id: number; directorUserId: number } | null> {
    return this.profilesApi
      .getCooperativeByDirector(userId)
      .pipe(
        map((cooperative) =>
          cooperative
            ? { id: Number(cooperative.id), directorUserId: cooperative.directorUserId }
            : null,
        ),
      );
  }

  /**
   * Publishes the cooperative memberships of an account.
   * @param userId - Account of the member.
   */
  membershipsByUser(userId: number): Observable<CooperativeMember[]> {
    return this.profilesApi.getMembershipsByUser(userId);
  }

  /**
   * Publishes the members of a cooperative.
   * @param cooperativeId - Cooperative that groups the members.
   */
  cooperativeMembers(cooperativeId: number): Observable<CooperativeMember[]> {
    return this.profilesApi.getCooperativeMembers(cooperativeId);
  }

  /**
   * Publishes the plots and the professionals a cooperative supervises.
   * @param cooperativeId - Cooperative that groups the members.
   */
  cooperativeScope(
    cooperativeId: number,
  ): Observable<{ plotIds: number[]; advisors: AdvisorSummary[] }> {
    return forkJoin({
      members: this.profilesApi.getCooperativeMembers(cooperativeId),
      assignments: this.profilesApi.getAssignmentsByCooperative(cooperativeId),
    }).pipe(
      switchMap(({ members, assignments }) => {
        const userIds = [...new Set(members.flatMap((member) =>
          member.active && member.userId !== null ? [member.userId] : [],
        ))];
        return forkJoin({
          plots: userIds.length ? forkJoin(userIds.map(this.injector.get(FarmingStore).plotSummariesByOwner)) : of([]),
          advisors: this.assignedAdvisors(assignments, cooperativeId),
        });
      }),
      map(({ plots, advisors }) => ({
        plotIds: [...new Set(plots.flat().map((plot) => plot.id))],
        advisors: advisors.map((advisor) => ({ userId: advisor.userId, name: advisor.name })),
      })),
    );
  }

  /**
   * Publishes the plots a professional is responsible for.
   * @param userId - Account of the professional.
   */
  responsibilitiesByAdvisor(userId: number): Observable<PlotResponsibility[]> {
    return this.profilesApi
      .getAssignmentsByAdvisor(userId)
      .pipe(map((items) => items.map(ProfilesStore.toResponsibility)));
  }

  /**
   * Publishes who is responsible for a plot.
   * @param plotId - Plot of the responsibility.
   */
  responsibilityByPlot(plotId: number): Observable<PlotResponsibility | null> {
    return this.profilesApi
      .getAssignmentByPlot(plotId)
      .pipe(map((item) => (item ? ProfilesStore.toResponsibility(item) : null)));
  }

  private static toResponsibility(item: PlotAdvisorAssignment): PlotResponsibility {
    return {
      plotId: item.plotId,
      producerUserId: item.producerUserId,
      advisorUserId: item.advisorUserId,
      status: item.status,
    };
  }

  // ---------- Responsibility assigned by the cooperative director (US-20) ----------

  private readonly directorScoped = computed(
    () => this.session.activeUser()?.experience === 'COOPERATIVE_DIRECTOR',
  );

  assignPlotAdvisor(
    cooperativeId: number,
    plotId: number,
    producerUserId: number,
    advisorUserId: number,
  ): Observable<PlotResponsibility> {
    const director = this.session.activeUser();
    if (!this.directorScoped() ||
      ![cooperativeId, plotId, producerUserId, advisorUserId].every((id) => Number.isSafeInteger(id) && id > 0)) {
      return throwError(() => new Error('profiles.advisory.errors.denied'));
    }
    return this.profilesApi.getAssignmentByPlot(plotId).pipe(
      switchMap((previous) => {
        if (!this.directorScoped() || this.session.activeUser()?.id !== director?.id ||
          (previous && (previous.producerUserId !== producerUserId || previous.cooperativeId !== cooperativeId))) {
          return throwError(() => new Error('profiles.advisory.errors.denied'));
        }
        if (!previous) return this.profilesApi.assign(cooperativeId, plotId, advisorUserId);
        if (previous.status === 'ACTIVE' && previous.advisorUserId === advisorUserId) return of(previous);
        return this.profilesApi.reassign(previous.id, advisorUserId);
      }),
      map(ProfilesStore.toResponsibility),
    );
  }

  // ---------- Advisor chosen by the producer ----------

  private readonly advisoryParticipant = signal<SessionParticipant | null>(null);
  private readonly advisorCatalogue = signal<TechnicalAdvisor[]>([]);
  private readonly advisoryAssignments = signal<PlotAdvisorAssignment[]>([]);
  private readonly advisoryLoadingSignal = signal(false);
  private readonly advisoryErrorSignal = signal<string | null>(null);
  private readonly advisoryMemberOfCooperative = signal(false);
  private advisoryRequests = new Subscription();
  private advisoryRevision = 0;

  private readonly advisoryScoped = computed(
    () =>
      this.advisoryParticipant() === this.session.activeUser() &&
      this.session.activeUser()?.experience === 'FARMER',
  );

  /** Professionals the producer can choose from. */
  readonly advisors = computed(() => (this.advisoryScoped() ? this.advisorCatalogue() : []));

  /** Responsibility records owned by the producer. */
  readonly assignments = computed(() =>
    this.advisoryScoped()
      ? this.advisoryAssignments().filter(
          (item) => item.producerUserId === this.session.activeUser()?.id,
        )
      : [],
  );

  readonly advisoryLoading = computed(() => this.advisoryScoped() && this.advisoryLoadingSignal());
  readonly advisoryError = computed(() =>
    this.advisoryScoped() ? this.advisoryErrorSignal() : null,
  );

  /** Reloads the catalogue and the assignments, dropping the previous producer's requests. */
  reloadAdvisory(): void {
    this.advisoryRequests.unsubscribe();
    this.advisoryRequests = new Subscription();
    const revision = ++this.advisoryRevision;
    const user = this.session.activeUser();
    this.advisoryParticipant.set(user);
    this.advisorCatalogue.set([]);
    this.advisoryAssignments.set([]);
    this.advisoryErrorSignal.set(null);
    this.advisoryLoadingSignal.set(false);
    this.advisoryMemberOfCooperative.set(false);
    if (user?.experience !== 'FARMER') return;
    this.advisoryLoadingSignal.set(true);
    this.advisoryRequests.add(
      forkJoin({
        assignments: this.profilesApi.getAssignmentsByProducer(user.id),
        memberships: this.profilesApi.getMembershipsByUser(user.id),
      }).pipe(switchMap(({ assignments, memberships }) =>
        this.assignedAdvisors(assignments).pipe(map((advisors) => ({ advisors, assignments, memberships }))),
      )).subscribe({
        next: ({ advisors, assignments, memberships }) => {
          if (!this.isCurrentAdvisory(revision)) return;
          this.advisorCatalogue.set(advisors);
          this.advisoryAssignments.set(assignments);
          this.advisoryMemberOfCooperative.set(memberships.some((member) => member.active));
          this.advisoryLoadingSignal.set(false);
        },
        error: () => {
          if (this.isCurrentAdvisory(revision)) {
            this.advisoryLoadingSignal.set(false);
            this.advisoryErrorSignal.set('profiles.advisory.errors.load');
          }
        },
      }),
    );
  }

  /** Returns the assignment of the current producer for a plot. */
  assignmentFor(plotId: number): PlotAdvisorAssignment | null {
    return this.assignments().find((item) => item.plotId === plotId) ?? null;
  }

  /** Returns the professional linked by account ID, never by a coincident record ID. */
  advisorFor(plotId: number): TechnicalAdvisor | null {
    const assignment = this.assignmentFor(plotId);

    return (
      this.advisors().find(
        (item) =>
          item.userId === (assignment?.status === 'ACTIVE' ? assignment.advisorUserId : undefined),
      ) ?? null
    );
  }

  /** Indicates whether the producer belongs to an active cooperative. */
  readonly advisorAssignedByDirector = computed(
    () => this.advisoryScoped() && this.advisoryMemberOfCooperative(),
  );

  private isCurrentAdvisory(revision: number): boolean {
    return revision === this.advisoryRevision && this.advisoryScoped();
  }
}
