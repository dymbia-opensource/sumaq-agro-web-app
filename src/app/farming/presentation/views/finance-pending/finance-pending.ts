import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';

@Component({
  selector: 'app-finance-pending',
  imports: [MessageCard, TranslatePipe],
  template: '<app-message-card icon="info" [message]="\'farming.finances.pending\' | translate" />',
})
export class FinancePending {}
