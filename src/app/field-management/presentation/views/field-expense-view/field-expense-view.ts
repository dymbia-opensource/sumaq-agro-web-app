import { Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { FieldManagementStore, RecordExpenseCommand } from '../../../application/field-management.store';
import { RecordDailyLaborExpenseCommand } from '../../../domain/model/commands/record-daily-labor-expense.command';
import { RecordFieldFreightExpenseCommand } from '../../../domain/model/commands/record-field-freight-expense.command';
import { RecordInputExpenseCommand } from '../../../domain/model/commands/record-input-expense.command';
import { ExpenseCategory } from '../../../domain/model/entities/expense-entry.entity';
import {
  FieldExpenseData,
  FieldExpenseForm,
} from '../../components/field-expense-form/field-expense-form';
import { EXPENSE_CATEGORY_ICONS } from '../../components/ledger-summary-cards/ledger-summary-cards';
import { OfflineSyncBanner } from '../../components/offline-sync-banner/offline-sync-banner';

const FINANCES_ROUTE = '/finances';

/** Registers an expense of the active campaign; each expense type has its own route (US-37 to US-39). */
@Component({
  selector: 'app-field-expense-view',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    FieldExpenseForm,
    OfflineSyncBanner,
  ],
  templateUrl: './field-expense-view.html',
  styleUrl: './field-expense-view.css',
})
export class FieldExpenseView {
  private readonly router = inject(Router);
  private readonly store = inject(FieldManagementStore);

  /** Comes from `data.category` of the route. */
  readonly category = input.required<ExpenseCategory>();

  // Store state
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly plot = this.store.selectedPlot;
  readonly ledger = this.store.ledger;
  readonly online = this.store.online;
  readonly pendingExpenseCount = this.store.pendingExpenseCount;
  readonly syncing = this.store.syncing;

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.my-plot', link: '/dashboard' },
    { label: 'option.expenses', link: FINANCES_ROUTE },
    { label: 'field-management.finances.register-expense' },
  ];

  protected readonly tabs = [
    { category: ExpenseCategory.INPUTS, link: `${FINANCES_ROUTE}/expenses/new/inputs` },
    { category: ExpenseCategory.LABOR, link: `${FINANCES_ROUTE}/expenses/new/labor` },
    { category: ExpenseCategory.FREIGHT, link: `${FINANCES_ROUTE}/expenses/new/freight` },
  ];
  protected readonly icons = EXPENSE_CATEGORY_ICONS;

  /** Expenses can only be added to an open ledger. */
  readonly canRecord = computed(() => !!this.ledger() && !this.ledger()!.frozen);

  // Actions
  onSync() {
    this.store.syncPendingExpenses();
  }

  /** Turns the form data into a domain command and sends it to the store. */
  onRecord(data: FieldExpenseData) {
    const ledgerId = this.ledger()?.id as number;
    this.store.recordExpense(this.toCommand(data, ledgerId), () => this.onCancel());
  }

  onCancel() {
    this.router.navigate([FINANCES_ROUTE]).then();
  }

  private toCommand(data: FieldExpenseData, ledgerId: number): RecordExpenseCommand {
    switch (data.category) {
      case ExpenseCategory.INPUTS:
        return new RecordInputExpenseCommand({ ledgerId, ...data });
      case ExpenseCategory.LABOR:
        return new RecordDailyLaborExpenseCommand({ ledgerId, ...data });
      case ExpenseCategory.FREIGHT:
        return new RecordFieldFreightExpenseCommand({ ledgerId, ...data });
    }
  }
}
