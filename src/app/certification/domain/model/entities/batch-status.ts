export const BatchStatus = {
  PENDING_GRADING: 'PENDING_GRADING',
  GRADED: 'GRADED',
  CERTIFIED: 'CERTIFIED',
} as const;

/** Los estados válidos se derivan de una única lista de valores. */
export type BatchStatus = (typeof BatchStatus)[keyof typeof BatchStatus];
