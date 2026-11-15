import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';
import { ExpenseCategory } from '../../../domain/model/entities/expense-entry.entity';

/** Doughnut chart with the cost of each expense category (US-16, US-17, US-19). */
@Component({
  selector: 'app-cost-distribution-card',
  imports: [
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    BaseChartDirective,
    TranslatePipe,
  ],
  templateUrl: './cost-distribution-card.html',
  styleUrl: './cost-distribution-card.css',
})
export class CostDistributionCard {
  private readonly translate = inject(TranslateService);

  /** Cost ledger of the campaign, or `null` if it has none. */
  readonly ledger = input<CampaignLedger | null>(null);

  /** Language in use, for the dates and the chart labels. */
  protected readonly language = computed(() => this.translate.currentLang() ?? 'en');

  /** Amount and share of each expense category. */
  protected readonly categories = computed(() => {
    const ledger = this.ledger();
    if (!ledger) return [];
    return Object.values(ExpenseCategory).map((category) => ({
      label: `farming.expense-category.${category}`,
      amount: ledger.totalByCategory(category),
      percentage: ledger.percentageByCategory(category),
    }));
  });

  /** Date of the first expense of the campaign. */
  protected readonly since = computed(
    () => (this.ledger() ? this.ledger()!.expenseHistory().at(-1)?.expenseDate : null) ?? null,
  );

  /** Data of the doughnut chart, or `null` when there are no expenses. */
  protected readonly chartData = computed<ChartConfiguration<'doughnut'>['data'] | null>(() => {
    this.language();
    const ledger = this.ledger();
    if (!ledger || ledger.totalInvestment().amount === 0) return null;
    const colors = this.themeColors();
    return {
      labels: this.categories().map((item) => this.translate.instant(item.label)),
      datasets: [
        {
          data: this.categories().map((item) => item.amount.amount),
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderWidth: 0,
        },
      ],
    };
  });

  /** Options of the doughnut chart: amounts in soles in the tooltip. */
  protected readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) =>
            ` ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
              item.parsed,
            )}`,
        },
      },
    },
  };

  /**
   * Colors of the chart, taken from the Angular Material theme.
   * The theme tokens use `light-dark()`, so the browser resolves them first.
   */
  private themeColors(): string[] {
    const probe = document.createElement('span');
    document.body.appendChild(probe);
    const colors = ['--mat-sys-primary', '--mat-sys-tertiary', '--mat-sys-tertiary-fixed-dim'].map(
      (token) => {
        probe.style.color = `var(${token})`;
        return getComputedStyle(probe).color;
      },
    );
    probe.remove();
    return colors;
  }
}
