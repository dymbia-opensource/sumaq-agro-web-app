import { Component, computed, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { PaymentStatus } from '../../../domain/model/entities/payment-status';

/**
 * Page where Mercado Pago sends the producer back after paying
 * (`/subscriptions/payment-result?payment_id=...`). It confirms the payment
 * with the platform and shows its outcome.
 */
@Component({
  selector: 'app-payment-result',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, RouterLink, TranslatePipe],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.css',
})
export class PaymentResult implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(SubscriptionsStore);
  private readonly iamStore = inject(IamStore);

  readonly result = this.store.paymentResult;
  readonly processing = this.store.processing;
  readonly error = this.store.error;

  protected readonly paymentStatuses = PaymentStatus;
  protected readonly dashboardRoute = computed(
    () => this.iamStore.activeUser()?.initialRoute ?? null,
  );

  ngOnInit(): void {
    this.store.confirmPayment(this.route.snapshot.queryParamMap.get('payment_id'));
  }
}
