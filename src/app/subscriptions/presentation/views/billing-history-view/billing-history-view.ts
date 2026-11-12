import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { CancelSubscriptionCommand } from '../../../domain/model/commands/cancel-subscription.command';
import { IamStore } from '../../../../iam/application/iam.store';

/** Current subscription and payment history of the signed-in user. */
@Component({
  selector: 'app-billing-history-view',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MessageCard,
    PageHeader,
    RouterLink,
    TranslatePipe,
  ],
  providers: [SubscriptionsStore],
  templateUrl: './billing-history-view.html',
  styleUrl: './billing-history-view.css',
})
export class BillingHistoryView {
  private readonly store = inject(SubscriptionsStore);
  private readonly iamStore = inject(IamStore);

  readonly subscription = this.store.subscription;
  readonly payments = this.store.payments;
  readonly loading = this.store.loading;
  readonly processing = this.store.processing;
  readonly error = this.store.error;

  /** Shows the second confirmation step before cancelling renewal. */
  readonly confirmingCancellation = signal(false);

  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'subscriptions.catalog.title', link: '/subscriptions/plans' },
    { label: 'subscriptions.billing.title' },
  ];

  constructor() {
    const userId = this.iamStore.activeUser()?.id ?? null;

    if (userId !== null) {
      this.store.loadMySubscription(userId);
    }
  }

  /** Cancels renewal only after the user confirms the action. */
  onCancelSubscription(): void {
    const id = this.subscription()?.id;
    const subscriptionId = this.numericId(id);
    if (subscriptionId === null || this.processing()) return;

    this.store.cancelSubscription(new CancelSubscriptionCommand({ subscriptionId }));
    this.confirmingCancellation.set(false);
  }

  /** Downloads the receipt for a payment identifier. */
  onDownloadReceipt(id: number | string | null): void {
    const paymentId = this.numericId(id);
    if (paymentId === null) return;
    this.store.downloadReceipt(paymentId);
  }

  private numericId(id: number | string | null | undefined): number | null {
    if (id === null || id === undefined || id === '') return null;
    const numericId = Number(id);
    return Number.isFinite(numericId) ? numericId : null;
  }
}
