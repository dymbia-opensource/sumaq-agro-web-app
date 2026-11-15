/** Kinds of operation kept on the device while there is no connection. */
export enum PendingOperationType {
  FIELD_EXPENSE = 'FIELD_EXPENSE',
}

/** An operation recorded without connection, waiting to be sent to the API. */
export interface PendingOperation<TPayload = unknown> {
  /** Code generated on the device; the API uses it to ignore duplicates. */
  uuid: string;
  /** Kind of operation. */
  type: PendingOperationType;
  /** Data of the operation, as the store saved it. */
  payload: TPayload;
  /** Date and time (ISO 8601) when it was recorded. */
  createdAt: string;
}
