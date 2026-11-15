import { HttpErrorResponse } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import {
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
} from "rxjs";
import { IamStore } from "../../iam/application/iam.store";
import { ProfilesStore } from "../../profiles/application/profiles.store";
import { CooperativeMember } from "../../profiles/domain/model/entities/cooperative-member.entity";
import { CertificationApi } from "../infrastructure/certification-api";
import {
  BatchEntry,
  HarvestBatchResource,
  QualityCertificateResource,
} from "../infrastructure/responses/certification-workspace.response";

interface Workspace {
  cooperativeId: number | null;
  members: CooperativeMember[];
  entries: BatchEntry[];
  loading: boolean;
  error: boolean;
}

const empty: Workspace = {
  cooperativeId: null,
  members: [],
  entries: [],
  loading: false,
  error: false,
};

@Injectable()
export class CertificationStore {
  private readonly api = inject(CertificationApi);
  private readonly profiles = inject(ProfilesStore);
  private readonly iam = inject(IamStore);
  private readonly refresh = new Subject<void>();
  private readonly changes = signal(new Map<number, BatchEntry>());

  readonly user = this.iam.activeUser;
  private readonly workspace = toSignal(
    toObservable(this.user).pipe(
      switchMap((user) =>
        this.refresh.pipe(
          startWith(undefined),
          switchMap(() => {
            this.changes.set(new Map());
            return user
              ? this.load(user.id, user.experience).pipe(
                  catchError(() => of({ ...empty, error: true })),
                  startWith({ ...empty, loading: true }),
                  map((workspace) => ({ user, workspace })),
                )
              : of({ user, workspace: empty });
          }),
        ),
      ),
    ),
  );
  readonly state = computed(() => {
    const loaded = this.workspace();
    return loaded?.user === this.user() ? (loaded?.workspace ?? empty) : empty;
  });
  readonly canManage = computed(
    () =>
      this.user()?.experience === "COOPERATIVE_DIRECTOR" &&
      this.state().cooperativeId !== null,
  );
  readonly entries = computed(() => {
    const rows = new Map(
      this.state().entries.map((entry) => [entry.batch.id, entry]),
    );
    if (this.workspace()?.user === this.user()) {
      for (const [id, update] of this.changes()) rows.set(id, update);
    }
    return [...rows.values()].sort((a, b) => b.batch.id - a.batch.id);
  });

  reload(): void {
    this.refresh.next();
  }

  updateBatch(batch: HarvestBatchResource): void {
    const previous = this.entries().find(
      (entry) => entry.batch.id === batch.id,
    );
    this.set({ batch, certificate: previous?.certificate ?? null });
  }

  updateCertificate(certificate: QualityCertificateResource): void {
    const previous = this.entries().find(
      (entry) => entry.batch.id === certificate.harvestBatchId,
    );
    if (previous) {
      this.set({
        batch: { ...previous.batch, status: "CERTIFIED" },
        certificate,
      });
    }
  }

  private set(entry: BatchEntry): void {
    this.changes.update((changes) =>
      new Map(changes).set(entry.batch.id, entry),
    );
  }

  private load(userId: number, experience: string): Observable<Workspace> {
    if (experience === "COOPERATIVE_DIRECTOR") {
      return this.profiles.cooperativeByDirector(userId).pipe(
        switchMap((cooperative) => {
          if (!cooperative || cooperative.directorUserId !== userId)
            return of(empty);
          const cooperativeId = cooperative.id;
          return forkJoin({
            members: this.profiles.cooperativeMembers(cooperativeId),
            entries: this.api.listBatches(cooperativeId),
          }).pipe(
            map(({ members, entries }) => ({
              ...empty,
              cooperativeId,
              members: members.filter((member) => member.active),
              entries,
            })),
          );
        }),
      );
    }
    if (experience === "FARMER") {
      return this.profiles.membershipsByUser(userId).pipe(
        switchMap((memberships) => {
          const ids = [
            ...new Set(
              memberships
                .filter((member) => member.active)
                .map((member) => member.cooperativeId),
            ),
          ];
          return ids.length
            ? forkJoin(ids.map((id) => this.api.listBatches(id))).pipe(
                map((entries) => ({ ...empty, entries: entries.flat() })),
              )
            : of(empty);
        }),
      );
    }
    return of(empty);
  }
}

export function certificationErrorKey(error: unknown): string {
  if (!(error instanceof HttpErrorResponse))
    return "certification.load-save-error";
  if (error.status === 0) return "certification.workspace.network-error";
  if (error.status === 403) return "certification.scope.not-authorized";
  if (error.status === 404) return "certification.workspace.not-found";
  if (error.status === 409) return "certification.workspace.conflict";
  if (error.status === 400 || error.status === 422)
    return "certification.workspace.invalid";
  return "certification.load-save-error";
}
