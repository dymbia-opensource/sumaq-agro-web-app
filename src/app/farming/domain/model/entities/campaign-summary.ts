import { CropType } from './crop-campaign.entity';

/**
 * Campaign data published to the other bounded contexts.
 *
 * @remarks
 * Harvest Certification and Profiles only need to know what is being grown on
 * a plot, never the cost ledger of the campaign.
 */
export interface CampaignSummary {
  readonly id: number;
  readonly plotId: number;
  readonly season: string;
  readonly cropType: CropType;
  readonly seedVariety: string;
}
