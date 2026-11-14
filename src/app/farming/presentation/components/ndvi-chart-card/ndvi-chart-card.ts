import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { SatelliteObservation } from '../../../../crop/domain/model/entities/satellite-observation.entity';

/** Line chart with the NDVI of the plot since the sowing date. */
@Component({
  selector: 'app-ndvi-chart-card',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    BaseChartDirective,
    TranslatePipe,
  ],
  templateUrl: './ndvi-chart-card.html',
  styleUrl: './ndvi-chart-card.css',
})
export class NdviChartCard {
  private readonly translate = inject(TranslateService);

  /** Satellite observations of the plot, oldest first. */
  readonly observations = input<SatelliteObservation[]>([]);

  /** Sowing date of the campaign; older observations are hidden. */
  readonly sowingDate = input<Date | null>();

  /** `true` while the observations are loading. */
  readonly loading = input(false);

  /** `true` when the observations could not be loaded. */
  readonly error = input(false);

  /** Points of the chart, with the dates in the current language. */
  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const locale = this.translate.currentLang() === 'es' ? 'es-PE' : 'en-US';
    const format = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      timeZone: 'America/Lima',
    });
    const sowingDate = this.sowingDate();
    const observations = this.observations().filter(
      (item) => !sowingDate || Date.parse(item.date) >= sowingDate.getTime(),
    );
    return {
      labels: observations.map((item) => format.format(new Date(item.date))),
      datasets: [
        {
          label: 'NDVI',
          data: observations.map((item) => item.ndviMean),
          borderColor: '#008000',
          backgroundColor: 'rgba(0, 128, 0, 0.12)',
          fill: true,
          tension: 0.25,
          pointRadius: 4,
        },
      ],
    };
  });

  readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { min: -1, max: 1 } },
    plugins: { legend: { display: false } },
  };
}
