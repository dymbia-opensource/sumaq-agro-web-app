import { UpdateFarmerAccountCommand } from '../domain/model/commands/update-farmer-account.command';
import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import {
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  throwError,
} from 'rxjs';
import { IamStore, SessionParticipant } from '../../iam/application/iam.store';
import { UpdateCooperativeCommand } from '../domain/model/commands/update-cooperative.command';
import { InviteTechnicalAdvisorCommand } from '../domain/model/commands/invite-technical-advisor.command';
import { ReassignTechnicalAdvisorCommand } from '../domain/model/commands/reassign-technical-advisor.command';
import { CooperativeMember } from '../domain/model/entities/cooperative-member.entity';
import { Cooperative } from '../domain/model/entities/cooperative.entity';
import { CooperativeDashboard } from '../domain/model/entities/cooperative-dashboard.entity';
import { FarmerProfile } from '../domain/model/entities/farmer-profile.entity';
import { TechnicalAdvisor } from '../domain/model/entities/technical-advisor.entity';
import { AdvisorSummary } from '../domain/model/entities/advisor-summary';
import { PlotAdvisorAssignment } from '../domain/model/entities/plot-advisor-assignment';
import { PlotResponsibility } from '../domain/model/entities/plot-responsibility';
import { ProfilesApi } from '../infrastructure/profiles-api';

/** Coordinates the institutional Profile read models for a cooperative director. */
@Injectable({ providedIn: 'root' })
export class ProfilesStore {
  private readonly profilesApi = inject(ProfilesApi);
  private readonly session = inject(IamStore);
  private readonly profileSignal = signal<FarmerProfile | null>(null);
  private readonly cooperativeSignal = signal<Cooperative | null>(null);
  private readonly membersSignal = signal<CooperativeMember[]>([]);
  private readonly technicalAdvisorsSignal = signal<TechnicalAdvisor[]>([]);
  private readonly dashboardSignal = signal<CooperativeDashboard | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  private readonly contactSavedSignal = signal(false);
  readonly contactSaved = this.contactSavedSignal.asReadonly();
  readonly profile = this.profileSignal.asReadonly();
  readonly cooperative = this.cooperativeSignal.asReadonly();
  readonly members = this.membersSignal.asReadonly();
  readonly technicalAdvisors = this.technicalAdvisorsSignal.asReadonly();
  readonly dashboard = this.dashboardSignal.asReadonly();
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

  /** Loads the role-specific read model for the active cooperative director. */
  loadCooperativeDashboard(directorUserId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.dashboardSignal.set(null);
    this.cooperativeSignal.set(null);
    this.profilesApi
      .getCooperativeByDirector(directorUserId)
      .pipe(
        switchMap((cooperative) => {
          this.cooperativeSignal.set(cooperative);
          return cooperative
            ? this.profilesApi.getInstitutionalDashboard(directorUserId)
            : of(null);
        }),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (dashboard) => this.dashboardSignal.set(dashboard),
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  /** Loads the cooperative, member summary, and technical team for the active director. */
  loadInstitutionalDashboard(directorUserId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .getCooperativeByDirector(directorUserId)
      .pipe(
        switchMap((cooperative) => {
          this.cooperativeSignal.set(cooperative);
          if (!cooperative) {
            return of({ members: [], advisors: [] });
          }
          const coopId = cooperative.id as number;
          return this.profilesApi
            .getCooperativeMembers(coopId)
            .pipe(
              switchMap((members) =>
                this.profilesApi
                  .getTechnicalAdvisors(coopId)
                  .pipe(switchMap((advisors) => of({ members, advisors }))),
              ),
            );
        }),
      )
      .subscribe({
        next: (result) => {
          this.membersSignal.set(result.members);
          this.technicalAdvisorsSignal.set(result.advisors);
          this.loadingSignal.set(false);
        },
        error: (error: Error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
        },
      });
  }

  /** Loads technical advisors specifically for a cooperative. */
  loadTechnicalAdvisors(cooperativeId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .getTechnicalAdvisors(cooperativeId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (advisors) => this.technicalAdvisorsSignal.set(advisors),
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  /** Validates and persists the director's institutional configuration. */
  saveCooperative(command: UpdateCooperativeCommand): void {
    const cooperative = this.cooperativeSignal();
    if (!cooperative) return;

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

  /** Invites a new technical advisor to the cooperative team. */
  inviteTechnicalAdvisor(command: InviteTechnicalAdvisorCommand): void {
    const newAdvisor = new TechnicalAdvisor({
      cooperativeId: command.cooperativeId,
      name: command.name,
      cipCode: command.cipCode,
      phone: command.phone,
      assignedPlotsCount: command.assignedPlotsCount,
    });

    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .createTechnicalAdvisor(newAdvisor)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: (createdAdvisor) => {
          this.technicalAdvisorsSignal.update((current) => [...current, createdAdvisor]);
        },
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  /** Reassigns or edits details for an existing technical advisor. */
  reassignTechnicalAdvisor(command: ReassignTechnicalAdvisorCommand): void {
    const advisors = this.technicalAdvisorsSignal();
    const advisor = advisors.find((item) => item.id === command.id);
    if (!advisor) return;

    try {
      advisor.updateDetails(
        command.name,
        command.cipCode,
        command.phone,
        command.assignedPlotsCount,
      );
    } catch (error) {
      this.errorSignal.set(error instanceof Error ? error.message : 'Datos inválidos.');
      return;
    }

    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .updateTechnicalAdvisor(advisor)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: (updatedAdvisor) => {
          this.technicalAdvisorsSignal.update((current) =>
            current.map((item) => (item.id === updatedAdvisor.id ? updatedAdvisor : item)),
          );
        },
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  /** Removes a technical advisor from the cooperative team. */
  removeTechnicalAdvisor(id: number): void {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .deleteTechnicalAdvisor(id)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: () => {
          this.technicalAdvisorsSignal.update((current) =>
            current.filter((item) => item.id !== id),
          );
        },
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  // ---------- Published reads for the other bounded contexts ----------

  /**
   * Publishes the professional linked to an account.
   * @param userId - Account of the professional.
   */
  advisorByUser(userId: number): Observable<AdvisorSummary | null> {
    return this.profilesApi
      .getAdvisorByUser(userId)
      .pipe(
        map((advisor): AdvisorSummary | null =>
          advisor ? { userId: advisor.userId, name: advisor.name } : null,
        ),
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
      advisors: this.profilesApi.getTechnicalAdvisors(cooperativeId),
    }).pipe(
      map(({ members, advisors }) => ({
        plotIds: [
          ...new Set(
            members
              .filter((member) => member.active)
              .flatMap((member) => member.plots.map((plot) => plot.id)),
          ),
        ],
        advisors: advisors.map((advisor): AdvisorSummary => ({
          userId: advisor.userId,
          name: advisor.name,
        })),
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

  /**
   * Links a plot of a member to a technical advisor of the cooperative.
   *
   * @remarks
   * Only a director assigns, and only to an advisor of the team already loaded
   * by {@link loadTechnicalAdvisors}. The previous responsible advisor is kept
   * in the history, so a reassignment never loses the earlier period.
   *
   * @param plotId - Plot of the member.
   * @param producerUserId - Account of the member who owns the plot.
   * @param advisorUserId - Account of the advisor who takes responsibility.
   */
  assignPlotAdvisor(
    plotId: number,
    producerUserId: number,
    advisorUserId: number,
  ): Observable<PlotResponsibility> {
    if (!this.directorScoped() || !Number.isSafeInteger(producerUserId) || producerUserId <= 0)
      return throwError(() => new Error('profiles.advisory.errors.denied'));
    if (!this.technicalAdvisors().some((advisor) => advisor.userId === advisorUserId))
      return throwError(() => new Error('profiles.advisory.errors.denied'));

    return this.profilesApi.getAssignmentByPlot(plotId).pipe(
      switchMap((previous) => {
        if (previous && previous.producerUserId !== producerUserId)
          return throwError(() => new Error('profiles.advisory.errors.denied'));
        const assignedAt = new Date().toISOString();
        // Only an advisor replaced while still in charge leaves a period open,
        // so only that case has something for the history to close; a release
        // already closed its own.
        const replaced =
          previous !== null &&
          previous.status === 'ACTIVE' &&
          previous.advisorUserId !== advisorUserId;
        // Supervision that was released and comes back starts again, even when
        // the same agronomist returns.
        const continues = previous !== null && previous.status === 'ACTIVE' && !replaced;
        const record: PlotAdvisorAssignment = {
          id: previous?.id ?? plotId,
          plotId,
          producerUserId,
          advisorUserId,
          status: 'ACTIVE',
          assignedAt: continues && previous ? previous.assignedAt : assignedAt,
          history: replaced
            ? [
                ...previous.history,
                {
                  advisorUserId: previous.advisorUserId,
                  assignedAt: previous.assignedAt,
                  endedAt: assignedAt,
                },
              ]
            : (previous?.history ?? []),
        };

        return this.profilesApi.saveAssignment(record, previous !== null);
      }),
      map(ProfilesStore.toResponsibility),
    );
  }

  /**
   * Removes the supervision of a plot, which stops appearing in the advisor panel.
   *
   * @param plotId - Plot that stops being supervised.
   */
  releasePlotAdvisor(plotId: number): Observable<null> {
    if (!this.directorScoped())
      return throwError(() => new Error('profiles.advisory.errors.denied'));

    return this.profilesApi.getAssignmentByPlot(plotId).pipe(
      switchMap((previous) => {
        if (!previous || previous.status !== 'ACTIVE') return of(null);
        const endedAt = new Date().toISOString();

        return this.profilesApi
          .saveAssignment(
            {
              ...previous,
              status: 'INACTIVE',
              history: [
                ...previous.history,
                {
                  advisorUserId: previous.advisorUserId,
                  assignedAt: previous.assignedAt,
                  endedAt,
                },
              ],
            },
            true,
          )
          .pipe(map(() => null));
      }),
    );
  }

  // ---------- Advisor chosen by the producer ----------

  private readonly advisoryParticipant = signal<SessionParticipant | null>(null);
  private readonly advisorCatalogue = signal<TechnicalAdvisor[]>([]);
  private readonly advisoryAssignments = signal<PlotAdvisorAssignment[]>([]);
  private readonly advisoryLoadingSignal = signal(false);
  private readonly advisorySavingSignal = signal(false);
  private readonly advisoryErrorSignal = signal<string | null>(null);
  private readonly advisoryReady = signal(false);
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
  readonly advisorySaving = computed(() => this.advisoryScoped() && this.advisorySavingSignal());
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
    this.advisorySavingSignal.set(false);
    this.advisoryReady.set(false);
    this.advisoryMemberOfCooperative.set(false);
    if (user?.experience !== 'FARMER') return;
    this.advisoryLoadingSignal.set(true);
    this.advisoryRequests.add(
      forkJoin({
        advisors: this.profilesApi.getAvailableAdvisors(),
        assignments: this.profilesApi.getAssignmentsByProducer(user.id),
        memberships: this.profilesApi.getMembershipsByUser(user.id),
      }).subscribe({
        next: ({ advisors, assignments, memberships }) => {
          if (!this.isCurrentAdvisory(revision)) return;
          this.advisorCatalogue.set(advisors);
          this.advisoryAssignments.set(assignments);
          this.advisoryMemberOfCooperative.set(memberships.some((member) => member.active));
          this.advisoryLoadingSignal.set(false);
          this.advisoryReady.set(true);
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

  /**
   * Indicates whether the producer belongs to a cooperative, where the director
   * is the one who assigns supervision (US-20).
   */
  readonly advisorAssignedByDirector = computed(
    () => this.advisoryScoped() && this.advisoryMemberOfCooperative(),
  );

  /**
   * Indicates whether the producer can change the professional of a plot.
   *
   * @remarks
   * Only an independent producer chooses: inside a cooperative the decision
   * belongs to the director, so the producer only sees who takes care of it.
   *
   * @param owned - The caller confirms the plot belongs to the active producer.
   */
  canAssign(owned: boolean): boolean {
    return (
      owned &&
      this.advisoryScoped() &&
      !this.advisoryMemberOfCooperative() &&
      this.advisoryReady() &&
      !this.advisoryLoading() &&
      !this.advisorySaving()
    );
  }

  /**
   * Changes responsibility after the view explicitly confirms the professional.
   * @param plotId - Plot of the active producer.
   * @param advisorUserId - Account of a selectable professional.
   * @param owned - The caller confirms the plot belongs to the active producer.
   * @param onSaved - Called only after the API confirms, in the same session.
   */
  assign(plotId: number, advisorUserId: number, owned: boolean, onSaved: () => void): void {
    if (this.advisorySaving()) return;
    if (!this.canAssign(owned) || !this.advisors().some((item) => item.userId === advisorUserId)) {
      this.advisoryErrorSignal.set('profiles.advisory.errors.denied');
      return;
    }
    const user = this.session.activeUser()!;
    const revision = this.advisoryRevision;
    this.advisorySavingSignal.set(true);
    this.advisoryErrorSignal.set(null);
    this.advisoryRequests.add(
      this.profilesApi
        .getAssignmentByPlot(plotId)
        .pipe(
          switchMap((previous) => {
            if (
              !this.isCurrentAdvisory(revision) ||
              (previous && previous.producerUserId !== user.id)
            )
              throw new Error('profiles.advisory.errors.denied');
            const assignedAt = new Date().toISOString();
            const history = previous?.history ?? [];
            const record: PlotAdvisorAssignment = {
              id: previous?.id ?? plotId,
              plotId,
              producerUserId: user.id,
              status: 'ACTIVE',
              advisorUserId,
              assignedAt:
                previous?.advisorUserId === advisorUserId ? previous.assignedAt : assignedAt,
              history:
                previous && previous.advisorUserId !== advisorUserId
                  ? [
                      ...history,
                      {
                        advisorUserId: previous.advisorUserId,
                        assignedAt: previous.assignedAt,
                        endedAt: assignedAt,
                      },
                    ]
                  : history,
            };
            return this.profilesApi.saveAssignment(record, previous !== null);
          }),
        )
        .subscribe({
          next: (record) => {
            if (!this.isCurrentAdvisory(revision)) return;
            this.advisoryAssignments.update((items) => [
              ...items.filter((item) => item.plotId !== plotId),
              record,
            ]);
            this.advisorySavingSignal.set(false);
            onSaved();
          },
          error: (error) => {
            if (!this.isCurrentAdvisory(revision)) return;
            this.advisorySavingSignal.set(false);
            this.advisoryErrorSignal.set(
              error instanceof Error && error.message.startsWith('profiles.advisory.errors.')
                ? error.message
                : 'profiles.advisory.errors.save',
            );
          },
        }),
    );
  }

  private isCurrentAdvisory(revision: number): boolean {
    return revision === this.advisoryRevision && this.advisoryScoped();
  }
}
