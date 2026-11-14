import { Component, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ExpenseCategory } from '../../../domain/model/entities/expense-entry.entity';
import { EXPENSE_CATEGORY_ICONS } from '../ledger-summary-cards/ledger-summary-cards';

/** Chips to filter the expense history by category (`ExpenseHistory` read model). */
@Component({
  selector: 'app-expense-category-filter',
  imports: [MatChipsModule, MatIconModule, TranslatePipe],
  templateUrl: './expense-category-filter.html',
  styleUrl: './expense-category-filter.css',
})
export class ExpenseCategoryFilter {
  /** Category shown, or `null` for all of them. */
  readonly selected = input<ExpenseCategory | null>(null);

  /** The producer chose another category (`null` = all). */
  readonly selectedChange = output<ExpenseCategory | null>();

  protected readonly categories = Object.values(ExpenseCategory);
  protected readonly icons = EXPENSE_CATEGORY_ICONS;

  protected onChange(value: ExpenseCategory | 'ALL' | undefined) {
    this.selectedChange.emit(!value || value === 'ALL' ? null : value);
  }
}
