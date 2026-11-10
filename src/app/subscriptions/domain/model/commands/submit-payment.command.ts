import { Money } from '../../../../shared/domain/model/money';
import { PaymentStatus } from '../entities/payment-status';

/**
 * Requests a simulated payment for the selected plan.
 */
export class SubmitPaymentCommand {
  /** `null` for the first payment, when the user has no subscription yet. */
  readonly subscriptionId: number | null;
  readonly amount: Money;
  readonly simulatedStatus: PaymentStatus.COMPLETED | PaymentStatus.REJECTED;

  constructor(props: {
    subscriptionId: number | null;
    amount: Money;
    simulatedStatus: PaymentStatus.COMPLETED | PaymentStatus.REJECTED;
  }) {
    this.subscriptionId = props.subscriptionId;
    this.amount = props.amount;
    this.simulatedStatus = props.simulatedStatus;
  }
}
