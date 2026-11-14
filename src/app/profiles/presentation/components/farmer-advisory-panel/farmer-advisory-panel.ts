import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfilesStore } from '../../../application/profiles.store';

/** Farmer-controlled demo responsibility selector, shared by plot detail and advisory inbox. */
@Component({
  selector: 'app-farmer-advisory-panel',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    TranslatePipe,
  ],
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
  private readonly session = inject(IamStore);
  readonly advisor = computed(() => this.store.advisorFor(this.plotId()));
  readonly assignment = computed(() => this.store.assignmentFor(this.plotId()));
  readonly selected = signal<number | null>(null);
  readonly confirming = signal(false);
  readonly saved = signal(false);

  constructor() {
    effect(() => {
      const assignment = this.assignment();
      untracked(() => {
        this.selected.set(assignment?.advisorUserId ?? null);
        this.confirming.set(false);
      });
    });
    effect(() => {
      this.session.activeUser();
      this.plotId();
      untracked(() => {
        this.saved.set(false);
        this.confirming.set(false);
      });
    });
  }

  /** Persists only after explicit confirmation; success is displayed after the API reply. */
  save(): void {
    const advisorUserId = this.selected();
    if (!this.confirming() || advisorUserId === null) return;
    this.store.assign(this.plotId(), advisorUserId, this.owned(), () => {
      this.confirming.set(false);
      this.saved.set(true);
    });
  }
}
