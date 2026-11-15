export const QualityCategory = {
  PREMIUM_GOLD: 'PREMIUM_GOLD',
  STANDARD: 'STANDARD',
  B_GRADE_REQUIRES_SORTING: 'B_GRADE_REQUIRES_SORTING',
  SPECIALTY_COFFEE: 'SPECIALTY_COFFEE',
  COMMERCIAL_COFFEE: 'COMMERCIAL_COFFEE',
} as const;

/** Evita asignar al lote una categoría fuera de las admitidas. */
export type QualityCategory = (typeof QualityCategory)[keyof typeof QualityCategory];
