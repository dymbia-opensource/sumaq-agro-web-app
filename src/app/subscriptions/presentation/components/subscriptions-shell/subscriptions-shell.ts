import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SubscriptionsStore } from '../../../application/subscriptions.store';

/**
 * Shares subscription state across the pages of this section.
 */
@Component({
  imports: [RouterOutlet],
  providers: [SubscriptionsStore],
  selector: 'app-subscriptions-shell',
  styleUrl: './subscriptions-shell.css',
  templateUrl: './subscriptions-shell.html',
})
export class SubscriptionsShell {}
