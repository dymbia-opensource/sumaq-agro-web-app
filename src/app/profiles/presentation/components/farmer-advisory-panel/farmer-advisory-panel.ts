import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfilesStore } from '../../../application/profiles.store';

/** Shows the supervision assigned to a producer’s plot. */
@Component({
  selector: 'app-farmer-advisory-panel',
  imports: [MatButtonModule, MatCardModule, MatProgressBarModule, TranslatePipe],
  templateUrl: './farmer-advisory-panel.html',
  styles: [
    `
      :host {
        display: block;
        margin-block: 16px;
      }
      mat-card-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 16px;
      }
      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      p {
        margin: 0;
        overflow-wrap: anywhere;
      }
      mat-form-field {
        width: 100%;
        max-width: 440px;
      }
    `,
  ],
})
export class FarmerAdvisoryPanel {
  readonly plotId = input.required<number>();
  /** The view confirms that the plot belongs to the signed-in producer. */
  readonly owned = input(false);
  readonly store = inject(ProfilesStore);
  readonly advisor = computed(() => this.store.advisorFor(this.plotId()));
  readonly assignment = computed(() => this.store.assignmentFor(this.plotId()));
}
