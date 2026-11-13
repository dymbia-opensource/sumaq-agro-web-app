import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ProfilesStore } from '../../../application/profiles.store';
import { IamStore } from '../../../../iam/application/iam.store';

/** Landing view for the cooperative director experience. */
@Component({
  selector: 'app-cooperative-dashboard-view',
  imports: [RouterLink, DecimalPipe, CurrencyPipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatProgressBarModule, MatSelectModule, BaseChartDirective, TranslatePipe],
  templateUrl: './cooperative-dashboard-view.html',
  styleUrl: './cooperative-dashboard-view.css',
})
export class CooperativeDashboardView {
  private readonly store = inject(ProfilesStore);
  private readonly session = inject(IamStore);
  readonly cooperative = this.store.cooperative;
  readonly dashboard = this.store.dashboard;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly ndviChartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const dashboard = this.dashboard();
    if (!dashboard) return null;
    return { labels: dashboard.ndviTrend.map((point) => point.month), datasets: [{ data: dashboard.ndviTrend.map((point) => point.value), borderColor: '#2e8b57', backgroundColor: 'rgba(46, 139, 87, 0.12)', fill: true, tension: 0.3, pointRadius: 0 }] };
  });
  readonly ndviChartOptions: ChartConfiguration<'line'>['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 0.8, ticks: { stepSize: 0.2 } } } };

  constructor() {
    const activeUser = this.session.activeUser();

    if (activeUser?.experience === 'COOPERATIVE_DIRECTOR') {
      this.store.loadCooperativeDashboard(activeUser.id);
    }
  }
}
