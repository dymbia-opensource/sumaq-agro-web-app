/**
 * Current responsibility over a plot, published to the other bounded contexts.
 *
 * @remarks
 * The assignment history stays inside Profiles.
 */
export interface PlotResponsibility {
  readonly plotId: number;
  readonly producerUserId: number;
  readonly advisorUserId: number;
  readonly status: 'ACTIVE' | 'INACTIVE';
}
