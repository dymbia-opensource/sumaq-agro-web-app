import { DatePipe, DecimalPipe } from "@angular/common";
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { TranslatePipe } from "@ngx-translate/core";
import {
  Observable,
  Subject,
  catchError,
  finalize,
  map,
  of,
  startWith,
  switchMap,
} from "rxjs";
import { FarmingStore } from "../../../../farming/application/farming.store";
import { PlotSummary } from "../../../../farming/domain/model/entities/plot-summary";
import { PageHeader } from "../../../../shared/presentation/components/page-header/page-header";
import {
  CertificationStore,
  certificationErrorKey,
} from "../../../application/certification.store";
import { HarvestCropType } from "../../../domain/model/entities/crop-type";
import { CertificationApi } from "../../../infrastructure/certification-api";

@Component({
  selector: "app-harvest-certificates",
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    RouterLink,
    TranslatePipe,
    MatButtonModule,
    PageHeader,
  ],
  providers: [CertificationStore],
  templateUrl: "./harvest-certificates.html",
  styleUrl: "./harvest-certificates.css",
})
export class HarvestCertificates {
  protected readonly store = inject(CertificationStore);
  private readonly api = inject(CertificationApi);
  private readonly farming = inject(FarmingStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly memberChanges = new Subject<number | null>();
  protected readonly plots = toSignal(
    this.memberChanges.pipe(
      switchMap((userId) =>
        userId === null
          ? of({ items: [], loading: false, error: false })
          : this.farming.plotSummariesByOwner(userId).pipe(
              map((items: PlotSummary[]) => ({
                items,
                loading: false,
                error: false,
              })),
              catchError(() => of({ items: [], loading: false, error: true })),
              startWith({ items: [], loading: true, error: false }),
            ),
      ),
    ),
    { initialValue: { items: [], loading: false, error: false } },
  );

  protected readonly selectedId = signal<number | null>(null);
  protected readonly selected = computed(() =>
    this.store.entries().find(({ batch }) => batch.id === this.selectedId()),
  );
  protected readonly registering = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal("");
  protected readonly notice = signal("");
  protected readonly crops = Object.values(HarvestCropType);
  protected readonly breadcrumbs = [{ label: "certification.page-title" }];
  protected readonly coffeeFields = [
    "aroma",
    "flavor",
    "acidity",
    "body",
    "totalScore",
  ] as const;

  protected form = this.emptyForm();
  protected weight = { grossWeightKg: 0, tareKg: 0 };
  protected sample = { sampleIdentifier: "", sampleWeightKg: 0 };
  protected potato = {
    firstPercentage: 0,
    secondPercentage: 0,
    thirdPercentage: 0,
    pestDamagePercentage: 0,
  };
  protected coffee = {
    aroma: 0,
    flavor: 0,
    acidity: 0,
    body: 0,
    totalScore: 0,
    fermentDefect: false,
  };
  protected certificateNumber = "";
  protected search = "";
  protected confirmRevocation = false;

  constructor() {
    effect(() => {
      this.store.user();
      this.selectedId.set(null);
      this.registering.set(false);
      this.resetOperation();
      this.memberChanges.next(null);
    });
  }

  protected startRegistration(): void {
    this.selectedId.set(null);
    this.registering.set(true);
    this.form = this.emptyForm();
    this.memberChanges.next(null);
    this.resetOperation();
  }

  protected selectMember(id: number | null): void {
    this.form.memberId = id;
    this.form.plotId = null;
    const member = this.store
      .state()
      .members.find((item) => Number(item.id) === id);
    this.memberChanges.next(member?.userId ?? null);
  }

  protected selectBatch(id: number): void {
    this.selectedId.set(id);
    this.registering.set(false);
    this.resetOperation();
  }

  protected register(): void {
    const cooperativeId = this.store.state().cooperativeId;
    const { memberId, plotId, batchCode, cropType, harvestedOn } = this.form;
    if (
      cooperativeId === null ||
      memberId === null ||
      plotId === null ||
      !this.plots().items.some((plot) => plot.id === plotId) ||
      !batchCode.trim() ||
      !harvestedOn
    )
      return;
    this.manage(
      this.api.register({
        cooperativeId,
        memberId,
        plotId,
        cropType,
        harvestedOn,
        batchCode: batchCode.trim(),
      }),
      (batch) => {
        this.store.updateBatch(batch);
        this.selectBatch(batch.id);
      },
    );
  }

  protected weigh(id: number): void {
    const { grossWeightKg, tareKg } = this.weight;
    if (!(grossWeightKg > tareKg && tareKg >= 0)) {
      this.error.set("certification.workspace.invalid-weight");
      return;
    }
    this.manage(this.api.weigh(id, this.weight), (batch) =>
      this.store.updateBatch(batch),
    );
  }

  protected extractSample(id: number): void {
    const sampleIdentifier = this.sample.sampleIdentifier.trim();
    const sampleWeightKg = this.sample.sampleWeightKg;
    if (sampleIdentifier && sampleWeightKg > 0) {
      this.manage(
        this.api.sample(id, { sampleIdentifier, sampleWeightKg }),
        (batch) => this.store.updateBatch(batch),
      );
    }
  }

  protected grade(id: number, crop: HarvestCropType): void {
    const { firstPercentage, secondPercentage, thirdPercentage } = this.potato;
    if (
      crop === "ANDEAN_POTATO" &&
      Math.abs(firstPercentage + secondPercentage + thirdPercentage - 100) >
        1e-8
    ) {
      this.error.set("certification.workspace.grade-instruction");
      return;
    }
    const grading =
      crop === "ANDEAN_POTATO"
        ? this.api.gradePotato(id, this.potato)
        : this.api.cupCoffee(id, this.coffee);
    this.manage(
      grading.pipe(
        switchMap((batch) =>
          batch.qualityCategory
            ? of(batch)
            : this.api.batch(id).pipe(catchError(() => of(batch))),
        ),
      ),
      (batch) => this.store.updateBatch(batch),
    );
  }

  protected issue(id: number): void {
    const issuedByUserId = this.store.user()?.id;
    const certificateNumber = this.certificateNumber.trim();
    if (issuedByUserId && certificateNumber) {
      this.manage(
        this.api.issue({
          certificateNumber,
          harvestBatchId: id,
          issuedByUserId,
        }),
        (certificate) => this.store.updateCertificate(certificate),
      );
    }
  }

  protected lookup(): void {
    const number = this.search.trim();
    if (!number) return;
    this.run(this.api.certificate(number), (certificate) => {
      if (
        !this.store
          .entries()
          .some(({ batch }) => batch.id === certificate.harvestBatchId)
      ) {
        this.error.set("certification.workspace.not-found");
        return;
      }
      this.store.updateCertificate(certificate);
      this.selectBatch(certificate.harvestBatchId);
    });
  }

  protected revoke(id: number): void {
    if (!this.confirmRevocation) {
      this.confirmRevocation = true;
      return;
    }
    this.manage(this.api.revoke(id), (certificate) => {
      this.confirmRevocation = false;
      this.store.updateCertificate(certificate);
    });
  }

  protected download(id: number, number: string): void {
    this.run(this.api.document(id), (pdf) => {
      const url = URL.createObjectURL(pdf);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = number + ".pdf";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  private manage<T>(
    request: Observable<T>,
    onSuccess: (value: T) => void,
  ): void {
    if (this.store.canManage()) this.run(request, onSuccess, true);
  }

  private run<T>(
    request: Observable<T>,
    onSuccess: (value: T) => void,
    mutation = false,
  ): void {
    const user = this.store.user();
    if (!user || this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    this.notice.set("");
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (value) => {
          if (this.store.user() !== user) return;
          onSuccess(value);
          if (mutation) this.notice.set("certification.workspace.saved");
        },
        error: (error: unknown) => {
          if (this.store.user() === user)
            this.error.set(certificationErrorKey(error));
        },
      });
  }

  private resetOperation(): void {
    this.error.set("");
    this.notice.set("");
    this.confirmRevocation = false;
    this.weight = { grossWeightKg: 0, tareKg: 0 };
    this.sample = { sampleIdentifier: "", sampleWeightKg: 0 };
    this.potato = {
      firstPercentage: 0,
      secondPercentage: 0,
      thirdPercentage: 0,
      pestDamagePercentage: 0,
    };
    this.coffee = {
      aroma: 0,
      flavor: 0,
      acidity: 0,
      body: 0,
      totalScore: 0,
      fermentDefect: false,
    };
    this.certificateNumber = "";
  }

  private emptyForm() {
    return {
      batchCode: "",
      memberId: null as number | null,
      plotId: null as number | null,
      cropType: HarvestCropType.ANDEAN_POTATO as HarvestCropType,
      harvestedOn: "",
    };
  }
}
