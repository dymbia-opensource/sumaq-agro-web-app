export const HarvestCropType = {
  ANDEAN_POTATO: 'ANDEAN_POTATO',
  SPECIALTY_COFFEE: 'SPECIALTY_COFFEE',
} as const;

export type HarvestCropType = (typeof HarvestCropType)[keyof typeof HarvestCropType];
