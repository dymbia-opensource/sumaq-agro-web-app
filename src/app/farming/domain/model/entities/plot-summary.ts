/**
 * Plot data published to the other bounded contexts.
 *
 * @remarks
 * It carries no campaigns, costs or aggregate behavior: Crop Health only needs
 * to locate the plot and know whether it has a polygon.
 */
export interface PlotSummary {
  readonly id: number;
  readonly ownerUserId: number;
  readonly name: string;
  readonly region: string;
  readonly areaHectares: number;
  readonly boundary: readonly { readonly latitude: number; readonly longitude: number }[];
  readonly hasPolygon: boolean;
}
