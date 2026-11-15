import {
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  untracked,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormGroupDirective,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import {
  Breadcrumb,
  PageHeader,
} from '../../../../shared/presentation/components/page-header/page-header';
import { CropStore } from '../../../application/crop.store';
import { IssueTechnicalPrescriptionCommand } from '../../../domain/model/commands/issue-technical-prescription.command';

@Component({
  selector: 'app-prescription-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    PageHeader,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './prescription-form.html',
  styleUrl: './prescription-form.css',
})
export class PrescriptionForm {
  /** Report this page hangs from, empty on the standalone form. */
  readonly reportId = input(0, { transform: numberAttribute });

  /** The inbox, which each menu names its own way, then the case, then this page. */
  protected readonly breadcrumbs = computed<Breadcrumb[]>(() => {
    const report = this.reportId();

    return [
      { label: 'option.diagnosis-inbox', link: '/pest-reports' },
      ...(report ? [{ label: 'crop.case.title', link: `/pest-reports/${report}` }] : []),
      { label: 'crop.prescribe-title' },
    ];
  });

  private readonly formDirective = viewChild(FormGroupDirective);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly store = inject(CropStore);
  readonly saved = signal(false);
  readonly prescriptionForm = this.fb.group({
    reportId: [0, Validators.min(1)],
    agronomistId: [0, Validators.min(1)],
    agrochemical: ['', [Validators.required, Validators.pattern(/\S/)]],
    dosage: ['', [Validators.required, Validators.pattern(/\S/)]],
    instructions: ['', [Validators.required, Validators.pattern(/\S/)]],
    applicationDate: ['', Validators.required],
  });
  constructor() {
    effect(() => {
      const ready = this.store.scopeReady();
      untracked(() => {
        this.saved.set(false);
        if (ready) this.load();
      });
    });
  }
  private load(): void {
    this.store.loadClinicalData(() => {
      this.prescriptionForm.enable();
      this.prescriptionForm.reset({ agronomistId: this.store.activeUser()?.id ?? 0 });
      const reportId = this.reportId();
      if (this.store.treatableReports().some((report) => report.id === reportId)) {
        this.prescriptionForm.controls.reportId.setValue(reportId);
      }
    });
  }
  onSubmit(): void {
    this.saved.set(false);
    this.prescriptionForm.markAllAsTouched();
    const value = this.prescriptionForm.getRawValue();
    if (
      this.prescriptionForm.invalid ||
      !this.store.canPrescribe() ||
      this.store.clinicalLoading() ||
      this.store.saving()
    )
      return;
    if (
      !this.store.pestReports().some((report) => report.id === value.reportId) ||
      !this.store.advisors().some((advisor) => advisor.userId === value.agronomistId)
    )
      return;
    if (!Number.isFinite(Date.parse(value.applicationDate))) {
      this.prescriptionForm.controls.applicationDate.setErrors({ invalidDate: true });
      return;
    }
    this.prescriptionForm.disable();
    this.store.issuePrescription(
      new IssueTechnicalPrescriptionCommand({
        reportId: value.reportId,
        agronomistId: value.agronomistId,
        product: value.agrochemical.trim(),
        dosage: value.dosage.trim(),
        instructions: value.instructions.trim(),
        applicationDate: value.applicationDate,
      }),
      () => {
        this.formDirective()?.resetForm({
          reportId: value.reportId,
          agronomistId: value.agronomistId,
        });
        this.prescriptionForm.enable();
        this.saved.set(true);
      },
      () => this.prescriptionForm.enable(),
    );
  }
}
