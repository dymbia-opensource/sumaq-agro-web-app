import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';
import { todayInLima } from '../../../domain/model/validation';

/**
 * Incident dossier with visits, prescriptions and immutable farmer follow-up.
 * @remarks
 * Absence, loading and failed queries are separate states. Application/evolution
 * evidence does not close the report or replace the agronomist's assessment.
 */
@Component({
  selector: 'app-farmer-case-view',
  imports: [
    PageHeader,
    DatePipe,
    RouterLink,
    TranslatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './farmer-case-view.html',
  styleUrl: './farmer-case-view.css',
})
export class FarmerCaseView {
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly assessmentSection = viewChild<ElementRef<HTMLElement>>('assessmentSection');
  readonly locale = computed(() => (this.translate.currentLang() === 'es' ? 'es' : 'en'));
  readonly id = input.required({ transform: numberAttribute });
  readonly store = inject(CropHealthStore);
  readonly report = computed(() => this.store.pestReports().find((item) => item.id === this.id()));
  readonly inspections = computed(() =>
    this.store.inspections().filter((item) => item.reportId === this.id()),
  );
  readonly prescriptions = computed(() =>
    this.store.prescriptions().filter((item) => item.reportId === this.id()),
  );
  readonly evidence = computed(() =>
    this.store
      .followUps()
      .filter((item) => item.data.reportId === this.id())
      .sort(
        (a, b) =>
          a.data.occurredOn.localeCompare(b.data.occurredOn) ||
          a.data.recordedAt.localeCompare(b.data.recordedAt),
      ),
  );
  readonly saved = signal(false);
  readonly loaded = signal(false);
  readonly today = todayInLima();
  private readonly formDirective = viewChild('followUpForm', { read: FormGroupDirective });
  private readonly assessmentDirective = viewChild('assessmentFormRef', {
    read: FormGroupDirective,
  });
  private assessmentDraft: { fingerprint: string; id: string } | null = null;
  readonly assessmentSaved = signal(false);
  readonly evaluations = computed(() =>
    this.store
      .assessments()
      .filter((item) => item.data.reportId === this.id())
      .sort((a, b) => a.data.recordedAt.localeCompare(b.data.recordedAt)),
  );
  readonly assessmentForm = new FormGroup({
    outcome: new FormControl<'FOLLOW_UP_REQUIRED' | 'RECOVERED'>('FOLLOW_UP_REQUIRED', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
    }),
  });
  private draft: { fingerprint: string; id: string } | null = null;
  readonly form = new FormGroup({
    prescriptionId: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] }),
    kind: new FormControl<'APPLICATION' | 'EVOLUTION'>('APPLICATION', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    occurredOn: new FormControl(todayInLima(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
    }),
  });

  constructor() {
    afterRenderEffect(() => {
      const section = this.assessmentSection();
      if (this.route.snapshot.fragment === 'assessment' && this.loaded() && section)
        section.nativeElement.scrollIntoView({ block: 'start' });
    });
    effect(() => {
      const ready = this.store.scopeReady();
      const user = this.store.activeUser();
      const id = this.id();
      untracked(() => {
        this.loaded.set(false);
        this.saved.set(false);
        this.draft = null;
        this.assessmentDraft = null;
        this.assessmentSaved.set(false);
        this.assessmentForm.enable();
        this.assessmentForm.reset({ outcome: 'FOLLOW_UP_REQUIRED', notes: '' });
        this.form.enable();
        this.form.reset({
          prescriptionId: 0,
          kind: 'APPLICATION',
          occurredOn: todayInLima(),
          notes: '',
        });
        if (ready && user && Number.isSafeInteger(id) && id > 0) this.reload();
        else if (ready) this.loaded.set(true);
      });
    });
  }

  /** Loads the authorized report dossier without querying arbitrary report IDs directly. */
  reload(): void {
    this.loaded.set(false);
    if (this.store.scopeError()) {
      this.store.retryScope();
      return;
    }
    this.store.loadClinicalData(() => {
      this.loaded.set(true);
      if (!this.form.controls.prescriptionId.value)
        this.form.controls.prescriptionId.setValue(Number(this.prescriptions()[0]?.id ?? 0));
    });
  }

  /** Records the professional conclusion with a stable ID retained on failed writes. */
  evaluate(): void {
    this.assessmentSaved.set(false);
    this.assessmentForm.markAllAsTouched();
    if (this.assessmentForm.invalid || this.store.saving() || !this.store.canAssess(this.id()))
      return;
    const value = this.assessmentForm.getRawValue();
    const notes = value.notes.trim();
    if (notes.length < 10) {
      this.assessmentForm.controls.notes.setErrors({ minlength: true });
      return;
    }
    const fingerprint = JSON.stringify({ ...value, notes, reportId: this.id() });
    if (this.assessmentDraft?.fingerprint !== fingerprint)
      this.assessmentDraft = { fingerprint, id: crypto.randomUUID() };
    this.assessmentForm.disable();
    this.store.recordAssessment(
      { ...value, notes, reportId: this.id(), id: this.assessmentDraft.id },
      () => {
        this.assessmentForm.enable();
        this.assessmentDirective()?.resetForm({ outcome: 'FOLLOW_UP_REQUIRED', notes: '' });
        this.assessmentDraft = null;
        this.assessmentSaved.set(true);
      },
      () => this.assessmentForm.enable(),
    );
  }

  /** Shows the prescribed product beside each evidence record. */
  prescriptionLabel(id: number): string {
    return this.prescriptions().find((item) => item.id === id)?.recommendedProducts ?? `#${id}`;
  }

  /**
   * Sends validated evidence; retries keep the same client ID and preserve failed drafts.
   * @remarks Application IDs are deterministic per prescription and producer to prevent
   * duplicate confirmations after an interrupted response from the fake API.
   */
  submit(): void {
    this.saved.set(false);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.store.saving() || this.store.clinicalLoading() || !this.report())
      return;
    const value = this.form.getRawValue();
    const notes = value.notes.trim();
    if (notes.length < 10) {
      this.form.controls.notes.setErrors({ minlength: true });
      return;
    }
    const fingerprint = JSON.stringify({ ...value, notes, reportId: this.id() });
    if (this.draft?.fingerprint !== fingerprint)
      this.draft = {
        fingerprint,
        id:
          value.kind === 'APPLICATION'
            ? `application-${value.prescriptionId}-${this.store.activeUser()!.id}`
            : crypto.randomUUID(),
      };
    this.form.disable();
    this.store.recordFollowUp(
      { ...value, notes, id: this.draft.id, reportId: this.id() },
      () => {
        const values = this.form.getRawValue();
        this.form.enable();
        this.formDirective()?.resetForm({ ...values, notes: '', kind: 'EVOLUTION' });
        this.draft = null;
        this.saved.set(true);
      },
      () => this.form.enable(),
    );
  }
}
