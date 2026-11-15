import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
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
import { ScheduleFieldInspectionCommand } from '../../../domain/model/commands/schedule-field-inspection.command';

@Component({
  selector: 'app-field-inspections',
  imports: [
    FormsModule,
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    PageHeader,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './field-inspections.html',
  styleUrl: './field-inspections.css',
})
/** Schedules and completes authorized inspections, optionally within a case dossier. */
export class FieldInspections {
  /** Report this page hangs from, empty on the standalone workspace. */
  readonly reportId = input(0, { transform: numberAttribute });

  /** The inbox, which each menu names its own way, then the case, then this page. */
  protected readonly breadcrumbs = computed<Breadcrumb[]>(() => {
    const report = this.reportId();

    return [
      { label: 'option.diagnosis-inbox', link: '/pest-reports' },
      ...(report ? [{ label: 'crop.case.title', link: `/pest-reports/${report}` }] : []),
      { label: 'crop.inspections-title' },
    ];
  });

  private readonly formDirective = viewChild(FormGroupDirective);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly store = inject(CropStore);
  /** Keeps the inspection workspace attached to the selected authorized case. */
  readonly caseInspections = computed(() => {
    const report = this.reportId();

    return this.store.inspections().filter((item) => !report || item.reportId === report);
  });
  readonly saved = signal(false);
  readonly savedMessage = signal('crop.inspection-saved');
  completionNotes: Record<number, string> = {};
  readonly inspectionForm = this.fb.group({
    reportId: [0, Validators.min(1)],
    scheduledAt: ['', Validators.required],
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
      this.inspectionForm.enable();
      this.inspectionForm.reset();
      this.completionNotes = {};
      const reportId = this.reportId();
      if (this.store.schedulableReports().some((report) => report.id === reportId)) {
        this.inspectionForm.controls.reportId.setValue(reportId);
      }
    });
  }
  /** Validates the visit date and persists the selected scoped report. */
  onSubmit(): void {
    this.saved.set(false);
    this.inspectionForm.markAllAsTouched();
    const value = this.inspectionForm.getRawValue();
    if (
      this.inspectionForm.invalid ||
      !this.store.canSchedule() ||
      this.store.clinicalLoading() ||
      this.store.saving()
    )
      return;
    if (!this.store.pestReports().some((report) => report.id === value.reportId)) return;
    const date = new Date(value.scheduledAt);
    if (!Number.isFinite(date.getTime())) {
      this.inspectionForm.controls.scheduledAt.setErrors({ invalidDate: true });
      return;
    }
    this.inspectionForm.disable();
    this.store.scheduleInspection(
      new ScheduleFieldInspectionCommand({
        reportId: value.reportId,
        scheduledAt: date.toISOString(),
      }),
      () => {
        this.formDirective()?.resetForm({ reportId: value.reportId });
        this.inspectionForm.enable();
        this.savedMessage.set('crop.inspection-saved');
        this.saved.set(true);
      },
      () => this.inspectionForm.enable(),
    );
  }
  /** Records professional findings and synchronizes the report status. */
  complete(id: number): void {
    this.saved.set(false);
    this.store.completeInspection(
      id,
      this.completionNotes[id] ?? '',
      () => {
        this.savedMessage.set('crop.inspection-completed');
        this.saved.set(true);
      },
      () => {},
    );
  }
}
