import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { ProfilesStore } from '../../profiles/application/profiles.store';
import { CooperativeMember } from '../../profiles/domain/model/entities/cooperative-member.entity';
import { FileDownloader } from '../../shared/infrastructure/file-downloader';
import { ExtractRepresentativeSampleCommand } from '../domain/model/commands/extract-representative-sample.command';
import { GradePotatoCalibersCommand } from '../domain/model/commands/grade-potato-calibers.command';
import { IssueQualityCertificateCommand } from '../domain/model/commands/issue-quality-certificate.command';
import { PerformCoffeeCuppingCommand } from '../domain/model/commands/perform-coffee-cupping.command';
import { RegisterHarvestBatchCommand } from '../domain/model/commands/register-harvest-batch.command';
import { RevokeQualityCertificateCommand } from '../domain/model/commands/revoke-quality-certificate.command';
import { VerifyCertificateCommand } from '../domain/model/commands/verify-certificate.command';
import { WeighDeliveredBatchCommand } from '../domain/model/commands/weigh-delivered-batch.command';
import { BatchEntry } from '../domain/model/entities/batch-entry';
import { BatchStatus } from '../domain/model/entities/batch-status';
import { HarvestCropType } from '../domain/model/entities/crop-type';
import { HarvestBatch } from '../domain/model/entities/harvest-batch.entity';
import { PublicTraceabilityRecord } from '../domain/model/entities/public-traceability-record.entity';
import { QualityCertificate } from '../domain/model/entities/quality-certificate.entity';
import { CertificationApi } from '../infrastructure/certification-api';

interface Workspace {
  cooperativeId: number | null;
  members: CooperativeMember[];
  entries: BatchEntry[];
  loading: boolean;
  error: boolean;
}

/** State of the public verification of a certificate. */
export interface Verification {
  loading?: boolean;
  record?: PublicTraceabilityRecord;
  error?: string;
}

/** Values of the potato grading form. */
export interface PotatoGrading {
  firstPercentage: number;
  secondPercentage: number;
  thirdPercentage: number;
  pestDamagePercentage: number;
}

/** Values of the coffee cupping form. */
export interface CoffeeCupping {
  aroma: number;
  flavor: number;
  acidity: number;
  body: number;
  totalScore: number;
  fermentDefect: boolean;
}

const empty: Workspace = {
  cooperativeId: null,
  members: [],
  entries: [],
  loading: false,
  error: false,
};

/**
 * Holds the Harvest Certification state and runs its use cases: register,
 * weigh, sample, grade and certify batches, and verify certificates.
 *
 * @remarks
 * The cooperative director manages the batches of the cooperative; a farmer
 * only reads the batches of the cooperatives they belong to. The views send
 * the values of their forms; the store builds the commands, so their
 * validations and the errors of the platform are handled in one place.
 */
@Injectable()
export class CertificationStore {
  private readonly api = inject(CertificationApi);
  private readonly profiles = inject(ProfilesStore);
  private readonly iam = inject(IamStore);
  private readonly fileDownloader = inject(FileDownloader);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh = new Subject<void>();
  private readonly changes = signal(new Map<number, BatchEntry>());

  private readonly busySignal = signal(false);
  private readonly errorSignal = signal('');
  private readonly noticeSignal = signal('');
  private readonly verificationSignal = signal<Verification>({ loading: true });

  readonly user = this.iam.activeUser;
  /** `true` while an operation is running. */
  readonly busy = this.busySignal.asReadonly();
  /** i18n key of the last error, or an empty string. */
  readonly error = this.errorSignal.asReadonly();
  /** i18n key of the last confirmation, or an empty string. */
  readonly notice = this.noticeSignal.asReadonly();
  /** Public verification of the certificate of the link. */
  readonly verification = this.verificationSignal.asReadonly();

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

  /** Only the director of a cooperative manages its batches. */
  readonly canManage = computed(
    () => this.user()?.experience === 'COOPERATIVE_DIRECTOR' && this.state().cooperativeId !== null,
  );

  /** Batches with their certificates, the most recent first. */
  readonly entries = computed(() => {
    const rows = new Map(this.state().entries.map((entry) => [entry.batch.batchId, entry]));
    if (this.workspace()?.user === this.user()) {
      for (const [id, update] of this.changes()) rows.set(id, update);
    }
    return [...rows.values()].sort((a, b) => b.batch.batchId - a.batch.batchId);
  });

  reload(): void {
    this.refresh.next();
  }

  /** Clears the result of the last operation. */
  clearFeedback(): void {
    this.errorSignal.set('');
    this.noticeSignal.set('');
  }

  // ---------- HarvestBatch aggregate ----------

  /**
   * Registers the batch a member delivers.
   * @param values - Values of the registration form.
   * @param onRegistered - Receives the new batch.
   */
  registerBatch(
    values: {
      batchCode: string;
      memberId: number;
      plotId: number;
      cropType: HarvestCropType;
      harvestedOn: string;
    },
    onRegistered: (batch: HarvestBatch) => void,
  ): void {
    const cooperativeId = this.state().cooperativeId;
    if (cooperativeId === null) return;
    this.manage(
      () => this.api.registerBatch(new RegisterHarvestBatchCommand({ ...values, cooperativeId })),
      (batch) => {
        this.setBatch(batch);
        onRegistered(batch);
      },
    );
  }

  weighBatch(batchId: number, values: { grossWeightKg: number; tareKg: number }): void {
    this.manage(
      () => this.api.weighBatch(new WeighDeliveredBatchCommand({ batchId, ...values })),
      (batch) => this.setBatch(batch),
    );
  }

  extractSample(batchId: number, values: { sampleIdentifier: string; sampleWeightKg: number }): void {
    this.manage(
      () =>
        this.api.extractSample(new ExtractRepresentativeSampleCommand({ batchId, ...values })),
      (batch) => this.setBatch(batch),
    );
  }

  /**
   * Grades a batch: by calibers for potato, by cupping for coffee.
   * @param batch - Batch to grade.
   * @param potato - Values of the potato form.
   * @param coffee - Values of the coffee form.
   */
  gradeBatch(batch: HarvestBatch, potato: PotatoGrading, coffee: CoffeeCupping): void {
    const batchId = batch.batchId;
    this.manage(
      () => {
        const grading =
          batch.cropType === HarvestCropType.ANDEAN_POTATO
            ? this.api.gradePotato(new GradePotatoCalibersCommand({ batchId, ...potato }))
            : this.api.cupCoffee(new PerformCoffeeCuppingCommand({ batchId, ...coffee }));
        // The category may be computed after the grading; read the batch again when it is missing.
        return grading.pipe(
          switchMap((graded) =>
            graded.qualityCategory
              ? of(graded)
              : this.api.getBatch(batchId).pipe(catchError(() => of(graded))),
          ),
        );
      },
      (graded) => this.setBatch(graded),
    );
  }

  // ---------- QualityCertificate aggregate ----------

  issueCertificate(harvestBatchId: number, certificateNumber: string): void {
    const issuedByUserId = this.user()?.id;
    if (issuedByUserId === undefined) return;
    this.manage(
      () =>
        this.api.issueCertificate(
          new IssueQualityCertificateCommand({ certificateNumber, harvestBatchId, issuedByUserId }),
        ),
      (certificate) => this.setCertificate(certificate),
    );
  }

  revokeCertificate(certificateId: number): void {
    this.manage(
      () => this.api.revokeCertificate(new RevokeQualityCertificateCommand({ certificateId })),
      (certificate) => this.setCertificate(certificate),
    );
  }

  /**
   * Finds a certificate of the workspace by its number.
   * @param certificateNumber - Number printed in the certificate.
   * @param onFound - Receives the batch of the certificate.
   */
  findCertificate(certificateNumber: string, onFound: (batchId: number) => void): void {
    const number = certificateNumber.trim();
    if (!number) return;
    this.run(
      () => this.api.getCertificateByNumber(number),
      (certificate) => {
        if (!this.entries().some(({ batch }) => batch.batchId === certificate.harvestBatchId)) {
          this.errorSignal.set('certification.workspace.not-found');
          return;
        }
        this.setCertificate(certificate);
        onFound(certificate.harvestBatchId);
      },
    );
  }

  /** Downloads the PDF of a certificate, with its QR code. */
  downloadCertificate(certificate: QualityCertificate): void {
    this.run(
      () => this.api.getCertificateDocument(certificate.certificateId),
      (content) =>
        this.fileDownloader.save({ fileName: `${certificate.certificateNumber}.pdf`, content }),
    );
  }

  // ---------- Public verification ----------

  /**
   * Verifies the certificate of a QR link. It does not need a session.
   * @param number - Certificate number of the link.
   * @param hash - SHA-256 hash of the link.
   */
  verifyCertificate(number: string | null, hash: string | null): void {
    let command: VerifyCertificateCommand;
    try {
      command = new VerifyCertificateCommand({ number, hash });
    } catch (error) {
      this.verificationSignal.set({ error: this.errorKey(error) });
      return;
    }
    this.verificationSignal.set({ loading: true });
    this.api
      .verifyCertificate(command)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (record) => this.verificationSignal.set({ record }),
        error: (error: unknown) =>
          this.verificationSignal.set({
            error:
              error instanceof HttpErrorResponse && error.status === 404
                ? 'certification.workspace.not-found'
                : 'certification.workspace.verification-unavailable',
          }),
      });
  }

  // ---------- Helpers ----------

  private setBatch(batch: HarvestBatch): void {
    const previous = this.entries().find((entry) => entry.batch.batchId === batch.batchId);
    this.setEntry({ batch, certificate: previous?.certificate ?? null });
  }

  private setCertificate(certificate: QualityCertificate): void {
    const previous = this.entries().find(
      (entry) => entry.batch.batchId === certificate.harvestBatchId,
    );
    if (previous) {
      this.setEntry({ batch: previous.batch.withStatus(BatchStatus.CERTIFIED), certificate });
    }
  }

  private setEntry(entry: BatchEntry): void {
    this.changes.update((changes) => new Map(changes).set(entry.batch.batchId, entry));
  }

  /** Runs a command of the director; the others only read. */
  private manage<T>(request: () => Observable<T>, onSuccess: (value: T) => void): void {
    if (this.canManage()) this.run(request, onSuccess, true);
  }

  /**
   * Runs one operation: builds its command (whose validation may fail), sends
   * it and shows the result. A response that arrives after the user changed is ignored.
   */
  private run<T>(request: () => Observable<T>, onSuccess: (value: T) => void, mutation = false): void {
    const user = this.user();
    if (!user || this.busySignal()) return;
    this.clearFeedback();
    let operation: Observable<T>;
    try {
      operation = request();
    } catch (error) {
      this.errorSignal.set(this.errorKey(error));
      return;
    }
    this.busySignal.set(true);
    operation
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busySignal.set(false)),
      )
      .subscribe({
        next: (value) => {
          if (this.user() !== user) return;
          onSuccess(value);
          if (mutation) this.noticeSignal.set('certification.workspace.saved');
        },
        error: (error: unknown) => {
          if (this.user() === user) this.errorSignal.set(this.errorKey(error));
        },
      });
  }

  private errorKey(error: unknown): string {
    if (error instanceof Error && error.message.startsWith('certification.')) return error.message;
    if (!(error instanceof HttpErrorResponse)) return 'certification.load-save-error';
    if (error.status === 0) return 'certification.workspace.network-error';
    if (error.status === 403) return 'certification.scope.not-authorized';
    if (error.status === 404) return 'certification.workspace.not-found';
    if (error.status === 409) return 'certification.workspace.conflict';
    if (error.status === 400 || error.status === 422) return 'certification.workspace.invalid';
    return 'certification.load-save-error';
  }

  private load(userId: number, experience: string): Observable<Workspace> {
    if (experience === 'COOPERATIVE_DIRECTOR') {
      return this.profiles.cooperativeByDirector(userId).pipe(
        switchMap((cooperative) => {
          if (!cooperative || cooperative.directorUserId !== userId) return of(empty);
          const cooperativeId = cooperative.id;
          return forkJoin({
            members: this.profiles.cooperativeMembers(cooperativeId),
            entries: this.api.getBatchesByCooperative(cooperativeId),
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
    if (experience === 'FARMER') {
      return this.profiles.membershipsByUser(userId).pipe(
        switchMap((memberships) => {
          const ids = [
            ...new Set(
              memberships.filter((member) => member.active).map((member) => member.cooperativeId),
            ),
          ];
          return ids.length
            ? forkJoin(ids.map((id) => this.api.getBatchesByCooperative(id))).pipe(
                map((entries) => ({ ...empty, entries: entries.flat() })),
              )
            : of(empty);
        }),
      );
    }
    return of(empty);
  }
}
