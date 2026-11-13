import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { CancelSubscriptionCommand } from '../../../domain/model/commands/cancel-subscription.command';
import { PaymentStatus } from '../../../domain/model/entities/payment-status';

/** Where the current period stands: renewing, ending (renewal cancelled) or expired. */
type PeriodState = 'renewing' | 'ending' | 'expired';

/** Label of the date tile for each period state. */
const END_DATE_LABEL: Readonly<Record<PeriodState, string>> = {
  renewing: 'subscriptions.billing.next-renewal',
  ending: 'subscriptions.billing.access-until',
  expired: 'subscriptions.billing.expired-on',
};

/** Current subscription and payment history of the signed-in user. */
@Component({
  selector: 'app-billing-history-view',
  imports: [
    DatePipe,
    MatButtonModule,
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

  protected readonly paymentStatuses = PaymentStatus;

  /** Period state of the subscription, or `null` when the user has none. */
  protected readonly state = computed<PeriodState | null>(() => {
    const current = this.subscription();
    if (!current) return null;
    if (!current.hasAccess()) return 'expired';
    return current.autoRenew ? 'renewing' : 'ending';
  });

  /** i18n key of the end date tile, according to the period state. */
  protected readonly endDateLabel = computed(() => END_DATE_LABEL[this.state() ?? 'renewing']);

  /** Percentage (0-100) of the paid period that has already elapsed, or `null` without end date. */
  protected readonly periodProgress = computed<number | null>(() => {
    const current = this.subscription();
    if (!current?.endDate) return null;

    const start = current.startDate.getTime();
    const end = current.endDate.getTime();
    if (end <= start) return null;

    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
  });

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
