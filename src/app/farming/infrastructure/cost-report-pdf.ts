import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { buildPdfPage } from '../../shared/infrastructure/text-pdf';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { ExpenseCategory } from '../domain/model/entities/expense-entry.entity';

/**
 * Builds the PDF cost report of a campaign (US-40) in the language chosen
 * by the visitor.
 */
@Injectable({ providedIn: 'root' })
export class CostReportPdf {
  private readonly translate = inject(TranslateService);

  /**
   * Draws the one-page report.
   * @param ledger - Ledger of the campaign.
   * @param season - Season of the campaign.
   * @param plotName - Name of the plot, if known.
   * @param area - Area of the plot in hectares.
   * @returns The PDF file.
   */
  build(ledger: CampaignLedger, season: string, plotName: string, area: number): Blob {
    return buildCostReport(ledger, season, plotName, area, (key, params) => this.translate.instant(key, params));
  }
}

function buildCostReport(
  ledger: CampaignLedger,
  season: string,
  plotName: string,
  area: number,
  t: (key: string, params?: Record<string, unknown>) => string,
): Blob {
  const operations: string[] = [];
  const fill = (color: string, x: number, y: number, width: number, height: number) => {
    operations.push([color, 'rg', x, y, width, height, 're f'].join(' '));
  };
  const text = (value: string, x: number, y: number, size: number, bold = false, color = '0.10 0.18 0.14') => {
    const hex = [...value].map((character) => {
      const code = character.codePointAt(0) ?? 63;
      return (code >= 32 && code <= 255 ? code : 63).toString(16).padStart(2, '0');
    }).join('');
    operations.push(['BT', color, 'rg', bold ? '/F2' : '/F1', size, 'Tf', x, y, 'Td', '<' + hex + '>', 'Tj ET'].join(' '));
  };

  fill('0.07 0.28 0.21', 0, 690, 595, 152);
  text('SUMAQAGRO', 48, 795, 12, true, '1 1 1');
  text(t('farming.reports.pdf.title'), 48, 756, 28, true, '1 1 1');
  text(t('farming.reports.pdf.campaign', { season: season.slice(0, 55) }), 48, 724, 13, false, '1 1 1');
  if (plotName) text(plotName.slice(0, 65), 48, 663, 14, true);

  fill('0.89 0.95 0.90', 48, 563, 499, 74);
  text(t('farming.reports.pdf.total'), 64, 611, 12, true);
  text(ledger.totalInvestment().format(), 64, 580, 24, true);
  text(t('farming.reports.pdf.expenses-count', { count: ledger.entries.length }), 365, 588, 12);

  text(t('farming.reports.pdf.breakdown'), 48, 522, 17, true);
  fill('0.94 0.96 0.94', 48, 470, 499, 32);
  text(t('farming.reports.pdf.category'), 64, 481, 11, true);
  const amountLabel = t('farming.reports.pdf.amount');
  text(amountLabel, 530 - amountLabel.length * 6.116, 481, 11, true);
  const rows = [
    [t('farming.reports.pdf.inputs'), ExpenseCategory.INPUTS],
    [t('farming.reports.pdf.labor'), ExpenseCategory.LABOR],
    [t('farming.reports.pdf.freight'), ExpenseCategory.FREIGHT],
  ] as const;
  rows.forEach(([label, category], index) => {
    const y = 444 - index * 38;
    const amount = ledger.totalByCategory(category).format();
    text(label, 64, y, 12);
    const width = [...amount].reduce((sum, char) => sum + (/[0-9S]/.test(char) ? (char === 'S' ? 8.004 : 6.672) : 3.336), 0);
    text(amount, 530 - width, y, 12);
    fill('0.86 0.90 0.86', 48, y - 12, 499, 1);
  });

  text(t('farming.reports.pdf.indicators'), 48, 314, 17, true);
  const unit = t('farming.yield-unit.' + ledger.yieldUnit);
  const indicators = [
    [t('farming.reports.pdf.cost-per-hectare'), area > 0 ? ledger.costPerHectare(area).format() : t('farming.reports.pdf.no-area')],
    [t('farming.reports.pdf.breakeven'), ledger.referenceYield() > 0 ? ledger.breakevenPrice().format() : t('farming.reports.pdf.no-yield')],
    [t('farming.reports.pdf.expected-yield'), ledger.expectedYield + ' ' + unit],
  ];
  indicators.forEach(([label, value], index) => {
    const x = 48 + index * 169;
    fill('0.94 0.96 0.94', x, 228, 161, 62);
    text(label, x + 10, 269, 10);
    text(value, x + 10, 245, 12, true);
  });

  return buildPdfPage(operations.join('\n'));
}
