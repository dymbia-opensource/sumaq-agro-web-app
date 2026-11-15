/** State of a subscription. A cancelled plan keeps its access until the end date. */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}
