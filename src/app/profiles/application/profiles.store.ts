import { UpdateFarmerAccountCommand } from '../domain/model/commands/update-farmer-account.command';
import { computed, inject, Service, signal } from '@angular/core';
import { finalize, of, switchMap } from 'rxjs';
import { UpdateFarmerContactCommand } from '../domain/model/commands/update-farmer-contact.command';
import { UpdateCooperativeCommand } from '../domain/model/commands/update-cooperative.command';
import { InviteTechnicalAdvisorCommand } from '../domain/model/commands/invite-technical-advisor.command';
import { ReassignTechnicalAdvisorCommand } from '../domain/model/commands/reassign-technical-advisor.command';
import { CooperativeMember } from '../domain/model/entities/cooperative-member.entity';
import { Cooperative } from '../domain/model/entities/cooperative.entity';
import { CooperativeDashboard } from '../domain/model/entities/cooperative-dashboard.entity';
import { FarmerProfile } from '../domain/model/entities/farmer-profile.entity';
import { TechnicalAdvisor } from '../domain/model/entities/technical-advisor.entity';
import { ProfilesApi } from '../infrastructure/profiles-api';

/** Coordinates the institutional Profile read models for a cooperative director. */
@Service()
export class ProfilesStore {
  private readonly profilesApi = inject(ProfilesApi);
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

  /** Validates and persists the farmer's contact data. */
  saveContact(command: UpdateFarmerContactCommand): void {
    this.persistFarmerProfile(command);
  }

  saveAccount(command: UpdateFarmerAccountCommand): void {
    this.persistFarmerProfile(command);
  }

  private persistFarmerProfile(
    command: UpdateFarmerContactCommand | UpdateFarmerAccountCommand,
  ): void {
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
      profile.updateContact(command.phoneNumber, command.email);
      if (command instanceof UpdateFarmerAccountCommand) {
        profile.updateName(command.firstName, command.lastName);
      }
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
    this.profilesApi.getCooperativeByDirector(directorUserId).pipe(
      switchMap((cooperative) => {
        this.cooperativeSignal.set(cooperative);
        return cooperative ? this.profilesApi.getInstitutionalDashboard(directorUserId) : of(null);
      }),
      finalize(() => this.loadingSignal.set(false)),
    ).subscribe({
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
}
