import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { Money } from '../../../../shared/domain/model/money';
import { ExpenseCategory } from '../../../domain/model/entities/expense-entry.entity';

/** Field tasks paid with daily wages (US-38). */
const LABOR_ACTIVITIES = ['SOWING', 'WEEDING', 'HILLING', 'SPRAYING', 'HARVEST'];

/** Data typed by the producer; its fields depend on the expense type. */
export type FieldExpenseData =
  | {
      category: ExpenseCategory.INPUTS;
      inputName: string;
      quantity: number;
      unitPrice: number;
      expenseDate: Date;
    }
  | {
      category: ExpenseCategory.LABOR;
      activity: string;
      workers: number;
      days: number;
      dailyWage: number;
      expenseDate: Date;
    }
  | { category: ExpenseCategory.FREIGHT; route: string; cost: number; expenseDate: Date };

/** Today as `YYYY-MM-DD`, the value of a date input. */
function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Form of one expense: inputs, labor or freight (US-37 to US-39). It validates and emits; the view saves. */
@Component({
  selector: 'app-field-expense-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './field-expense-form.html',
  styleUrl: './field-expense-form.css',
})
export class FieldExpenseForm {
  private fb = inject(FormBuilder).nonNullable;

  readonly category = input.required<ExpenseCategory>();
  readonly saving = input(false);

  readonly submitted = output<FieldExpenseData>();
  readonly cancel = output<void>();

  protected readonly categories = ExpenseCategory;
  protected readonly activities = LABOR_ACTIVITIES;

  // One form group per expense type
  protected readonly inputForm = this.fb.group({
    inputName: ['', [Validators.required, Validators.maxLength(60)]],
    quantity: [null as number | null, [Validators.required, Validators.min(0.01)]],
    unitPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
    expenseDate: [today(), Validators.required],
  });

  protected readonly laborForm = this.fb.group({
    activity: ['', Validators.required],
    workers: [null as number | null, [Validators.required, Validators.min(1)]],
    days: [null as number | null, [Validators.required, Validators.min(0.5)]],
    dailyWage: [null as number | null, [Validators.required, Validators.min(0.01)]],
    expenseDate: [today(), Validators.required],
  });

  protected readonly freightForm = this.fb.group({
    route: ['', [Validators.required, Validators.maxLength(80)]],
    cost: [null as number | null, [Validators.required, Validators.min(0.01)]],
    expenseDate: [today(), Validators.required],
  });

  private readonly inputValue = toSignal(this.inputForm.valueChanges, {
    initialValue: this.inputForm.value,
  });
  private readonly laborValue = toSignal(this.laborForm.valueChanges, {
    initialValue: this.laborForm.value,
  });
  private readonly freightValue = toSignal(this.freightForm.valueChanges, {
    initialValue: this.freightForm.value,
  });

  /** Total shown while typing, e.g. 3 × S/ 45 = S/ 135 (US-37, US-38). */
  protected readonly total = computed(() => {
    switch (this.category()) {
      case ExpenseCategory.INPUTS: {
        const { quantity, unitPrice } = this.inputValue();
        return new Money(Math.max((quantity ?? 0) * (unitPrice ?? 0), 0));
      }
      case ExpenseCategory.LABOR: {
        const { workers, days, dailyWage } = this.laborValue();
        return new Money(Math.max((workers ?? 0) * (days ?? 0) * (dailyWage ?? 0), 0));
      }
      default:
        return new Money(Math.max(this.freightValue().cost ?? 0, 0));
    }
  });

  /** The form group of the current expense type. */
  private currentForm() {
    switch (this.category()) {
      case ExpenseCategory.INPUTS:
        return this.inputForm;
      case ExpenseCategory.LABOR:
        return this.laborForm;
      default:
        return this.freightForm;
    }
  }

  protected onSubmit() {
    const form = this.currentForm();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    const [year, month, day] = form.getRawValue().expenseDate.split('-').map(Number);
    const expenseDate = new Date(year, month - 1, day);

    switch (this.category()) {
      // The validators already rejected empty numbers, so `!` is safe here.
      case ExpenseCategory.INPUTS: {
        const { inputName, quantity, unitPrice } = this.inputForm.getRawValue();
        this.submitted.emit({
          category: ExpenseCategory.INPUTS,
          inputName,
          quantity: quantity!,
          unitPrice: unitPrice!,
          expenseDate,
        });
        break;
      }
      case ExpenseCategory.LABOR: {
        const { activity, workers, days, dailyWage } = this.laborForm.getRawValue();
        this.submitted.emit({
          category: ExpenseCategory.LABOR,
          activity,
          workers: workers!,
          days: days!,
          dailyWage: dailyWage!,
          expenseDate,
        });
        break;
      }
      default: {
        const { route, cost } = this.freightForm.getRawValue();
        this.submitted.emit({ category: ExpenseCategory.FREIGHT, route, cost: cost!, expenseDate });
      }
    }
  }
}
