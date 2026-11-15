import { Money } from '../../../../shared/domain/model/money';
import { PaymentStatus } from './payment-status';
import { PlanCode } from './plan-code';

/** One checkout attempt recorded by the server. */
export class Payment {
  readonly reference: string;
  readonly planCode: PlanCode;
  readonly amount: Money;
  readonly status: PaymentStatus;
  readonly attemptedAt: Date;

  constructor(props: {
    reference: string;
    planCode: PlanCode;
    amount: Money;
    status: PaymentStatus;
    attemptedAt: Date;
  }) {
    this.reference = props.reference;
    this.planCode = props.planCode;
    this.amount = props.amount;
    this.status = props.status;
    this.attemptedAt = props.attemptedAt;
  }

  isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }
}
