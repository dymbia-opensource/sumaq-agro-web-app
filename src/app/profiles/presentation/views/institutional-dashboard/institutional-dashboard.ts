import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfilesStore } from '../../../application/profiles.store';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-institutional-dashboard',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatProgressBarModule, TranslatePipe],
  templateUrl: './institutional-dashboard.html',
  styleUrl: './institutional-dashboard.css',
})
export class InstitutionalDashboard {
  private readonly store = inject(ProfilesStore);
  readonly cooperative = this.store.cooperative;
  readonly activeMembers = this.store.activeMemberCount;
  readonly advisors = this.store.technicalAdvisors;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  constructor() {
    const user = inject(IamStore).activeUser();
    if (user?.experience === 'COOPERATIVE_DIRECTOR') {
      this.store.loadInstitutionalDashboard(user.id);
    }
  }
}
