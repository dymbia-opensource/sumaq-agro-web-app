import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/**
 * Resource representation of a crop campaign.
 */
export interface CropCampaignResource extends BaseResource {
  /** Unique identifier of the campaign. */
  id: number;
  /** Plot where the campaign takes place. */
  fieldPlotId: number;
  /** Agricultural season (for example, `2026-I`). */
  season: string;
  /** Crop (`ANDEAN_POTATO` or `SPECIALTY_COFFEE`). */
  cropType: string;
  /** Seed variety sown. */
  seedVariety: string;
  /** `true` when the producer typed a variety that is not in the catalog. */
  customSeedVariety?: boolean;
  /** Date in `YYYY-MM-DD` format, or `null` if the crop is not sown yet. */
  sowingDate: string | null;
  /** Status (`IN_PROGRESS` or `FINISHED`). */
  status: string;
}

/**
 * Response envelope for crop campaign collection queries.
 */
export interface CropCampaignsResponse extends BaseResponse {
  /** Crop campaign resources included in the response. */
  campaigns: CropCampaignResource[];
}
