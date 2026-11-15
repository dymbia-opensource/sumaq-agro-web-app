import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Tells the producer that there is no connection, or that some expenses are
 * waiting to be synchronized.
 */
@Component({
  selector: 'app-offline-sync-banner',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './offline-sync-banner.html',
  styleUrl: './offline-sync-banner.css',
})
export class OfflineSyncBanner {
  readonly online = input.required<boolean>();
  readonly pending = input.required<number>();
  readonly syncing = input(false);

  /** The producer wants to synchronize now. */
  readonly sync = output<void>();
}
