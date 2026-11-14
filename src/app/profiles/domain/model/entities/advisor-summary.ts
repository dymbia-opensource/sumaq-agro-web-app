/**
 * Technical advisor data published to the other bounded contexts.
 *
 * @remarks
 * It carries the account and the name only; the profile aggregate stays in Profiles.
 */
export interface AdvisorSummary {
  readonly userId?: number;
  readonly name: string;
}
