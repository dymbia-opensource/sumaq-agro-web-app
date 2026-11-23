/** Stage of a harvest batch: registered, graded or certified. */
export const BatchStatus = {
  PENDING: 'PENDING',
  GRADED: 'GRADED',
  CERTIFIED: 'CERTIFIED',
} as const;
/** The valid states come from a single list of values. */
export type BatchStatus = (typeof BatchStatus)[keyof typeof BatchStatus];
