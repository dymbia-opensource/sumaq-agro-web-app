import { computed, DestroyRef, effect, inject, Service, signal, untracked } from '@angular/core';
import { forkJoin, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { CooperativeMember } from '../../profiles/domain/model/entities/cooperative-member.entity';
import { ProfilesApi } from '../../profiles/infrastructure/profiles-api';
import { IamStore, SessionParticipant } from '../../iam/application/iam.store';
import { RegisterHarvestBatchCommand } from '../domain/model/commands/register-harvest-batch.command';
import { IssueQualityCertificateCommand } from '../domain/model/commands/issue-quality-certificate.command';
import { HarvestBatch } from '../domain/model/entities/harvest-batch.entity';
import { QualityCertificate } from '../domain/model/entities/quality-certificate.entity';
import { HarvestCertificationApi } from '../infrastructure/harvest-certification-api';

/** Membership scope, separate from the authenticated account. */
interface CertificationScope {
  cooperativeId: number | null;
  members: CooperativeMember[];
}

/**
 * Coordinates certificates using explicit Profiles relationships.
 * @remarks
 * Session checks prevent accidental cross-participant UI actions. The production
 * backend must authorize resources and derive the issuer from authenticated identity.
 */
@Service()
export class HarvestCertificationStore {
  private readonly api = inject(HarvestCertificationApi);
  private readonly profiles = inject(ProfilesApi);
  private readonly session = inject(IamStore);
  private readonly batchesSignal = signal<HarvestBatch[]>([]);
  private readonly certificatesSignal = signal<QualityCertificate[]>([]);
  private readonly membersSignal = signal<CooperativeMember[]>([]);
  private readonly cooperativeSignal = signal<number | null>(null);
  private readonly participantSignal = signal<SessionParticipant | null>(null);
  private readonly readySignal = signal(false);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly noticeSignal = signal<string | null>(null);
  private requests = new Subscription();
  private revision = 0;

  /** Hides previous state immediately, before the session effect runs. */
  private readonly current = computed(() => this.participantSignal() === this.session.activeUser());
  readonly batches = computed(() => (this.current() ? this.batchesSignal() : []));
  readonly certificates = computed(() => (this.current() ? this.certificatesSignal() : []));
  readonly members = computed(() => (this.current() ? this.membersSignal() : []));
  readonly cooperativeId = computed(() => (this.current() ? this.cooperativeSignal() : null));
  readonly loading = computed(() => this.current() && this.loadingSignal());
  readonly error = computed(() => (this.current() ? this.errorSignal() : null));
  /** Translation key explaining missing relationships or unsupported participation. */
  readonly notice = computed(() => (this.current() ? this.noticeSignal() : null));
  /** Director identity resolved for the currently loaded cooperative. */
  readonly issuer = computed(() =>
    this.current() &&
    this.readySignal() &&
    this.session.activeUser()?.experience === 'COOPERATIVE_DIRECTOR' &&
    this.cooperativeId() !== null
      ? this.session.activeUser()
      : null,
  );
  readonly canIssue = computed(() => this.issuer() !== null);
  readonly activeCertificates = computed(() =>
    this.certificates().filter((item) => item.data.status === 'ACTIVE'),
  );

  constructor() {
    effect(() => {
      this.session.activeUser();
      untracked(() => this.load());
    });
    inject(DestroyRef).onDestroy(() => this.requests.unsubscribe());
  }

  /**
   * Reloads the active participant's relationships and certificates.
   * @remarks
   * Cancels previous requests. Farmers match by userId and active membership;
   * directors match by cooperative ownership. Missing legacy links fail closed.
   */
  load(): void {
    this.requests.unsubscribe();
    this.requests = new Subscription();
    const revision = ++this.revision;
    const user = this.session.activeUser();
    this.participantSignal.set(user);
    this.batchesSignal.set([]);
    this.certificatesSignal.set([]);
    this.membersSignal.set([]);
    this.cooperativeSignal.set(null);
    this.readySignal.set(false);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.noticeSignal.set(null);
    if (!user || user.experience === 'AGRONOMIST') {
      this.noticeSignal.set('harvest-certification.scope.not-authorized');
      return;
    }
    this.loadingSignal.set(true);
    this.requests.add(
      this.resolveScope(user)
        .pipe(
          switchMap((scope) => {
            const ids = scope.members.map((member) => member.cooperativeId);
            if (scope.cooperativeId !== null) ids.push(scope.cooperativeId);
            const uniqueIds = [...new Set(ids)];
            if (!uniqueIds.length)
              return of({
                scope,
                batches: [] as HarvestBatch[],
                certificates: [] as QualityCertificate[],
              });
            return forkJoin({
              groups: forkJoin(uniqueIds.map((id) => this.api.getBatches(id))),
              certificates: this.api.getCertificates(),
            }).pipe(
              map(({ groups, certificates }) => {
                const batches = groups
                  .flat()
                  .filter((batch) =>
                    scope.members.some(
                      (member) =>
                        member.id === batch.data.memberId &&
                        member.cooperativeId === batch.data.cooperativeId,
                    ),
                  );
                const batchIds = new Set(batches.map((batch) => batch.id));
                return {
                  scope,
                  batches,
                  certificates: certificates.filter((item) =>
                    batchIds.has(item.data.harvestBatchId),
                  ),
                };
              }),
            );
          }),
        )
        .subscribe({
          next: ({ scope, batches, certificates }) => {
            if (!this.isCurrent(revision)) return;
            this.membersSignal.set(scope.members);
            this.cooperativeSignal.set(scope.cooperativeId);
            this.batchesSignal.set(batches);
            this.certificatesSignal.set(certificates);
            this.readySignal.set(true);
            this.loadingSignal.set(false);
            if (user.experience === 'COOPERATIVE_DIRECTOR' && scope.cooperativeId === null) {
              this.noticeSignal.set('harvest-certification.scope.no-cooperative');
            }
          },
          error: () => {
            if (this.isCurrent(revision)) this.fail('harvest-certification.scope.load-error');
          },
        }),
    );
  }

  /**
   * Persists a lot for an active member of the director's cooperative.
   * @param batch - Evaluated lot referencing a member's plot and campaign.
   * @param onSuccess - Runs after a confirmed save in the same participant session.
   */
  register(batch: RegisterHarvestBatchCommand, onSuccess: (saved: HarvestBatch) => void): void {
    if (this.loading()) return;
    const member = this.members().find(
      (item) => item.id === batch.memberId && item.cooperativeId === batch.cooperativeId,
    );
    const plot = member?.plots.find(
      (item) => item.id === batch.plotId && item.campaignId === batch.campaignId,
    );
    if (!this.canIssue() || batch.cooperativeId !== this.cooperativeId() || !plot) {
      this.fail('harvest-certification.scope.not-authorized');
      return;
    }
    const revision = this.revision;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.requests.add(
      this.api
        .createBatch({
          ...batch,
          memberName: member!.fullName,
          plotName: plot.name,
          plotRegion: plot.region,
          coordinates: plot.coordinates,
          variety: plot.variety,
          cropType: plot.cropType,
        })
        .subscribe({
          next: (saved) => {
            if (!this.isCurrent(revision)) return;
            this.batchesSignal.update((items) => [saved, ...items]);
            this.loadingSignal.set(false);
            onSuccess(saved);
          },
          error: () => {
            if (this.isCurrent(revision)) this.fail('harvest-certification.errors.save-batch');
          },
        }),
    );
  }

  /**
   * Issues for a loaded lot, deriving the issuer from the current participant.
   * @param batch - Loaded, graded lot within the director's cooperative.
   * @param data - Draft; issuer fields are replaced by session identity.
   * @param onSuccess - Runs only when certificate and lot updates both succeed.
   */
  certify(batch: HarvestBatch, data: IssueQualityCertificateCommand, onSuccess: () => void): void {
    if (this.loading()) return;
    const issuer = this.issuer();
    const loaded = this.batches().find((item) => item.id === batch.id);
    if (
      !issuer ||
      !loaded ||
      loaded.data.cooperativeId !== this.cooperativeId() ||
      data.harvestBatchId !== loaded.id
    ) {
      this.fail('harvest-certification.scope.not-authorized');
      return;
    }
    if (!loaded.canIssueCertificate) {
      this.fail('harvest-certification.errors.batch-not-graded');
      return;
    }
    if (this.certificates().some((item) => item.data.harvestBatchId === loaded.id)) {
      this.fail('harvest-certification.errors.already-certified');
      return;
    }
    const revision = this.revision;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.requests.add(
      this.api
        .createCertificate({ ...data, issuedByUserId: issuer.id, issuedByName: issuer.displayName })
        .pipe(
          switchMap((certificate) => {
            if (!this.isCurrent(revision)) return of(null);
            this.certificatesSignal.update((items) => [certificate, ...items]);
            return this.api.updateBatch({ ...loaded.data, status: 'CERTIFIED' });
          }),
        )
        .subscribe({
          next: (updated) => {
            if (!updated || !this.isCurrent(revision)) return;
            this.batchesSignal.update((items) =>
              items.map((item) => (item.id === updated.id ? updated : item)),
            );
            this.loadingSignal.set(false);
            onSuccess();
          },
          error: () => {
            if (this.isCurrent(revision))
              this.fail('harvest-certification.errors.issue-incomplete');
          },
        }),
    );
  }

  /** Resolves farmer membership or the director's institutional scope. */
  private resolveScope(user: SessionParticipant): Observable<CertificationScope> {
    if (user.experience === 'FARMER') {
      return this.profiles.getMembershipsByUser(user.id).pipe(
        map((members) => ({
          cooperativeId: null,
          members: members.filter((item) => item.active && item.userId === user.id),
        })),
      );
    }
    return this.profiles.getCooperativeByDirector(user.id).pipe(
      switchMap((cooperative) => {
        if (!cooperative || cooperative.directorUserId !== user.id)
          return of({ cooperativeId: null, members: [] });
        const cooperativeId = cooperative.id as number;
        return this.profiles.getCooperativeMembers(cooperativeId).pipe(
          map((members) => ({
            cooperativeId,
            members: members.filter((item) => item.active && item.cooperativeId === cooperativeId),
          })),
        );
      }),
    );
  }

  /** Rejects late replies, including the interval before the session effect runs. */
  private isCurrent(revision: number): boolean {
    return revision === this.revision && this.current();
  }

  /** Stores a translated error without claiming a successful save. */
  private fail(key: string): void {
    this.errorSignal.set(key);
    this.loadingSignal.set(false);
  }
}
