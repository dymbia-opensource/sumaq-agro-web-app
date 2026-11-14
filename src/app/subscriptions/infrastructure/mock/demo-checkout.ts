import { map, Observable, of, switchMap } from 'rxjs';
import { BillingCycle } from '../../domain/model/entities/billing-cycle';
import { Payment } from '../../domain/model/entities/payment.entity';
import { PaymentStatus } from '../../domain/model/entities/payment-status';
import { Plan } from '../../domain/model/entities/plan.entity';
import { Subscription } from '../../domain/model/entities/subscription.entity';
import { SubmitPaymentCommand } from '../../domain/model/commands/submit-payment.command';
import { PaymentsApiEndpoint } from '../endpoints/payments.endpoint';
import { SubscriptionsApiEndpoint } from '../endpoints/subscriptions.endpoint';

export interface DemoCheckoutRequest {
  userId: number;
  plan: Plan;
  billingCycle: BillingCycle;
  currentSubscription: Subscription | null;
  command: SubmitPaymentCommand;
}

interface CheckoutResult {
  status: SubmitPaymentCommand['simulatedStatus'];
  subscription: Subscription | null;
  payment: Payment | null;
}

/** Simulates a checkout against JSON Server for the university demo. */
export class DemoCheckout {
  constructor(
    private readonly subscriptions: SubscriptionsApiEndpoint,
    private readonly payments: PaymentsApiEndpoint,
  ) {}

  submit({
    userId,
    plan,
    billingCycle,
    currentSubscription,
    command,
  }: DemoCheckoutRequest): Observable<CheckoutResult> {
    const status = command.simulatedStatus;
    const now = new Date();
    const recordPayment = (subscriptionId: number) =>
      this.payments.create(
        new Payment({
          id: 0,
          subscriptionId,
          amount: command.amount,
          transactionToken: `demo-tx-${crypto.randomUUID()}`,
          status,
          paidAt: now,
        }),
      );

    if (status === PaymentStatus.REJECTED) {
      return currentSubscription
        ? recordPayment(Number(currentSubscription.id)).pipe(
            map((payment) => ({ status, subscription: null, payment })),
          )
        : of({ status, subscription: null, payment: null });
    }

    const next = currentSubscription?.copy() ??
      Subscription.start({ userId, plan, billingCycle, startDate: now });
    if (currentSubscription) next.changePlan(plan, billingCycle, now);

    // JSON Server writes these resources separately. The backend will commit them together.
    const saved$ = currentSubscription
      ? this.subscriptions.update(next, next.id)
      : this.subscriptions.create(next);

    return saved$.pipe(
      switchMap((subscription) =>
        recordPayment(Number(subscription.id)).pipe(
          map((payment) => ({ status, subscription, payment })),
        ),
      ),
    );
  }
}
