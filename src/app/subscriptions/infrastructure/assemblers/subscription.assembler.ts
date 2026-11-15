import { fromApiDate } from '../../../shared/infrastructure/api-date';
import { Subscription } from '../../domain/model/entities/subscription.entity';
import { SubscriptionResource } from '../responses/subscription.response';

export class SubscriptionAssembler {
  toEntityFromResource = (resource: SubscriptionResource): Subscription =>
    new Subscription({
      ...resource,
      startDate: fromApiDate(resource.startDate),
      endDate: fromApiDate(resource.endDate),
    });
}
