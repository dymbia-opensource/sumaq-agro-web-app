import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { ExpenseEntry } from '../../../domain/model/entities/expense-entry.entity';
import { EXPENSE_CATEGORY_ICONS } from '../ledger-summary-cards/ledger-summary-cards';

/** Table with the expenses of the campaign, the most recent first (US-36). */
@Component({
  selector: 'app-expense-list',
  imports: [DatePipe, MatCardModule, MatIconModule, MatTableModule, TranslatePipe],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.css',
})
export class ExpenseList {
  readonly entries = input.required<ExpenseEntry[]>();

  protected readonly columns = [
    'date',
    'category',
    'description',
    'quantity',
    'unitPrice',
    'total',
  ];

  protected iconOf(entry: ExpenseEntry): string {
    return EXPENSE_CATEGORY_ICONS[entry.category];
  }
}
