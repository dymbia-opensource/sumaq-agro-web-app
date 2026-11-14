import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { PendingOperation, PendingOperationType } from './pending-operation';

const STORAGE_KEY = 'sumaq-agro-pending-operations';

/**
 * Keeps on the device the expenses recorded without connection (TS-05) until
 * the store sends them to the API, and tells whether the device is connected.
 * The `uuid` lets the API ignore an expense that was already saved.
 */
@Injectable({ providedIn: 'root' })
export class OfflineSync {
  private readonly onlineSignal = signal(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  private readonly operationsSignal = signal<PendingOperation[]>(OfflineSync.read());

  /** `true` while the device has connection. */
  readonly isOnline = this.onlineSignal.asReadonly();

  /** Number of operations waiting to be synchronized, of any type. */
  readonly pendingCount = computed(() => this.operationsSignal().length);

  constructor() {
    if (typeof window === 'undefined') return;
    const update = () => this.onlineSignal.set(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    });
  }

  /**
   * Keeps an operation on the device.
   * @param operation - The operation recorded without connection.
   */
  enqueue(operation: PendingOperation): void {
    this.write([...this.operationsSignal(), operation]);
  }

  /**
   * Pending operations of one type, in the order they were recorded.
   * @param type - Kind of operation.
   */
  pendingOf<TPayload>(type: PendingOperationType): PendingOperation<TPayload>[] {
    return this.operationsSignal().filter(
      (operation) => operation.type === type,
    ) as PendingOperation<TPayload>[];
  }

  /**
   * Number of pending operations of one type, as a signal.
   * @param type - Kind of operation.
   */
  pendingCountOf(type: PendingOperationType): Signal<number> {
    return computed(
      () => this.operationsSignal().filter((operation) => operation.type === type).length,
    );
  }

  /**
   * Forgets the operations already saved in the API.
   * @param uuids - Device codes of the synchronized operations.
   */
  remove(uuids: string[]): void {
    this.write(this.operationsSignal().filter((operation) => !uuids.includes(operation.uuid)));
  }

  private write(operations: PendingOperation[]): void {
    this.operationsSignal.set(operations);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    } catch {
      // Without storage the operations stay in memory until the page closes.
    }
  }

  private static read(): PendingOperation[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PendingOperation[];
    } catch {
      return [];
    }
  }
}
