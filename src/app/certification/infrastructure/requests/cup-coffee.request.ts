/** Payload sent to grade a coffee batch (`POST /harvest-batches/{id}/coffee-cupping`). */
export interface CupCoffeeRequest {
  aroma: number;
  flavor: number;
  acidity: number;
  body: number;
  totalScore: number;
  fermentDefect: boolean;
}
