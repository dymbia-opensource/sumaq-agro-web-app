import { Money } from '../../../shared/domain/model/money';
import { Payment } from '../../domain/model/entities/payment.entity';
import { PaymentResource } from '../responses/payment.response';

export class PaymentAssembler {
  toEntityFromResource = (resource: PaymentResource): Payment =>
    new Payment({
      reference: resource.reference,
      planCode: resource.planCode,
      amount: new Money(resource.amount, resource.currency),
      status: resource.status,
      attemptedAt: new Date(resource.attemptedAt),
    });
}
