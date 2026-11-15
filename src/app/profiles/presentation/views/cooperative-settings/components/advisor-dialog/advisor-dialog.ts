import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TechnicalAdvisor } from '../../../../../domain/model/entities/technical-advisor.entity';

export interface AdvisorDialogData {
  mode: 'invite' | 'reassign';
  advisor?: TechnicalAdvisor;
}

@Component({
  selector: 'app-advisor-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './advisor-dialog.html',
  styleUrl: './advisor-dialog.css',
})
export class AdvisorDialog {
  private readonly dialogRef = inject(MatDialogRef<AdvisorDialog>);
  readonly data = inject<AdvisorDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.mode === 'reassign';

  readonly form = new FormGroup({
    name: new FormControl(this.data.advisor?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    cipCode: new FormControl(this.data.advisor?.cipCode ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phone: new FormControl(this.data.advisor?.phone ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    assignedPlotsCount: new FormControl(this.data.advisor?.assignedPlotsCount ?? 0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
