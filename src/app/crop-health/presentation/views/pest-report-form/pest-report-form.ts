import { Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { FormGroupDirective, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';
import { RecordPestReportCommand } from '../../../domain/model/commands/record-pest-report.command';
@Component({
  selector: 'app-pest-report-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule, MatIconModule],
  templateUrl: './pest-report-form.html', styleUrl: './pest-report-form.css',
})
export class PestReportForm {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly store = inject(CropHealthStore);
  readonly plots = this.store.plots;
  readonly loadingPlots = this.store.scopeLoading;
  readonly optionsError = this.store.scopeError;
  readonly saved = signal(false);
  private readonly formDirective = viewChild(FormGroupDirective);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  readonly reportForm = this.fb.group({
    plotId: [0, Validators.min(1)],
    description: ['', [Validators.required, Validators.minLength(10), Validators.pattern(/\S/)]],
    severity: ['LOW', Validators.required],
  });
  constructor() {
    effect(() => {
      const user = this.store.activeUser(); const ready = this.store.scopeReady();
      untracked(() => {
        this.saved.set(false); this.reportForm.enable();
        this.reportForm.reset({ plotId: ready ? Number(this.store.selectedPlot()?.id ?? 0) : 0, severity: 'LOW' });
        if (!user || !this.store.canReport()) this.reportForm.disable();
      });
    });
  }
  onSubmit(): void {
    this.saved.set(false);
    const value = this.reportForm.getRawValue();
    this.reportForm.controls.description.setValue(value.description.trim());
    this.reportForm.markAllAsTouched();
    const user = this.store.activeUser();
    if (this.reportForm.invalid || this.reportForm.disabled || this.store.saving() || !user) return;
    this.reportForm.disable();
    this.store.recordReport(new RecordPestReportCommand({
      plotId: value.plotId, reporterId: user.id, description: value.description.trim(),
      severity: value.severity, photo: '', clientSyncId: crypto.randomUUID(),
    }), () => {
      this.formDirective()?.resetForm({ plotId: value.plotId, severity: 'LOW', description: '' });
      this.reportForm.enable(); this.saved.set(true);
      this.snackBar.open(this.translate.instant('crop-health.report-saved'), this.translate.instant('crop-health.view-inbox'), { duration: 7000 }).onAction().subscribe(() => { void this.router.navigate(['/pest-reports']); });
    }, () => this.reportForm.enable());
  }
}
