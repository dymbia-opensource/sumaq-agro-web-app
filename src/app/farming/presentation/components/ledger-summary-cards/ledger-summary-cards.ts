import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';
import { ExpenseCategory } from '../../../domain/model/entities/expense-entry.entity';

/** Icon of each expense category. */
export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.INPUTS]: 'compost',
  [ExpenseCategory.LABOR]: 'engineering',
  [ExpenseCategory.FREIGHT]: 'local_shipping',
};

/** Total invested and the cost of each category of the campaign (US-36). */
@Component({
  selector: 'app-ledger-summary-cards',
  imports: [DecimalPipe, MatCardModule, MatIconModule, TranslatePipe],
  templateUrl: './ledger-summary-cards.html',
  styleUrl: './ledger-summary-cards.css',
})
export class LedgerSummaryCards {
  readonly ledger = input.required<CampaignLedger>();

  protected readonly categories = computed(() =>
    Object.values(ExpenseCategory).map((category) => ({
      category,
      icon: EXPENSE_CATEGORY_ICONS[category],
      amount: this.ledger().totalByCategory(category),
      percentage: this.ledger().percentageByCategory(category),
    })),
  );
}
