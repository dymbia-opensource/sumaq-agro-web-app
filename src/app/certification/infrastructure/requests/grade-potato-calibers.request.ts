/** Payload sent to grade a potato batch (`POST /harvest-batches/{id}/potato-calibers`). */
export interface GradePotatoCalibersRequest {
  firstPercentage: number;
  secondPercentage: number;
  thirdPercentage: number;
  pestDamagePercentage: number;
}
