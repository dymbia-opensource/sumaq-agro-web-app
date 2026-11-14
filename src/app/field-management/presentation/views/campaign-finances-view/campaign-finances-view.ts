import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { FieldManagementStore } from '../../../application/field-management.store';
import { SetExpectedYieldCommand } from '../../../domain/model/commands/set-expected-yield.command';
import { ExpenseCategory } from '../../../domain/model/entities/expense-entry.entity';
import { BreakevenPanel } from '../../components/breakeven-panel/breakeven-panel';
import { ExpenseCategoryFilter } from '../../components/expense-category-filter/expense-category-filter';
import { ExpenseList } from '../../components/expense-list/expense-list';
import {
  EXPENSE_CATEGORY_ICONS,
  LedgerSummaryCards,
} from '../../components/ledger-summary-cards/ledger-summary-cards';
import { OfflineSyncBanner } from '../../components/offline-sync-banner/offline-sync-banner';

/**
 * "My expenses and earnings": cost ledger and breakeven price of the active campaign
 * (US-36, US-40), with the expense history filtered by category (`ExpenseHistory`).
 */
@Component({
  selector: 'app-campaign-finances-view',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    LedgerSummaryCards,
    ExpenseList,
    ExpenseCategoryFilter,
    BreakevenPanel,
    OfflineSyncBanner,
  ],
  templateUrl: './campaign-finances-view.html',
  styleUrl: './campaign-finances-view.css',
})
export class CampaignFinancesView {
  private readonly store = inject(FieldManagementStore);

  // Store state
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly plot = this.store.selectedPlot;
  readonly campaign = this.store.activeCampaign;
  readonly ledger = this.store.ledger;
  readonly online = this.store.online;
  readonly pendingExpenseCount = this.store.pendingExpenseCount;
  readonly syncing = this.store.syncing;

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.my-plot', link: '/dashboard' },
    { label: 'option.expenses' },
  ];

  /** One link per expense type; each one opens its own route. */
  protected readonly expenseLinks = [
    { label: 'field-management.expense-category.INPUTS', link: 'expenses/new/inputs', icon: EXPENSE_CATEGORY_ICONS.INPUTS },
    { label: 'field-management.expense-category.LABOR', link: 'expenses/new/labor', icon: EXPENSE_CATEGORY_ICONS.LABOR },
    { label: 'field-management.expense-category.FREIGHT', link: 'expenses/new/freight', icon: EXPENSE_CATEGORY_ICONS.FREIGHT },
  ];

  /** Category of the expense history, or `null` for all of them. */
  readonly categoryFilter = signal<ExpenseCategory | null>(null);

  /** `ExpenseHistory` read model: expenses of the chosen category, the most recent first. */
  readonly expenseHistory = computed(() => (this.ledger() ? this.ledger()!.expenseHistory(this.categoryFilter()) : []));

  /** Values of the subtitle, e.g. "Pampa Alta | Season 2026-I". */
  readonly subtitleParams = computed(() => ({
    plot: this.plot()?.name ?? '',
    season: this.campaign()?.season ?? '',
  }));

  // Actions
  onSync() {
    this.store.syncPendingExpenses();
  }

  onExpectedYieldChange(expectedYield: number) {
    const ledger = this.ledger();
    if (!ledger) return;
    this.store.setExpectedYield(
      new SetExpectedYieldCommand({ ledgerId: ledger.id as number, expectedYield, unit: ledger.yieldUnit }),
    );
  }
}
