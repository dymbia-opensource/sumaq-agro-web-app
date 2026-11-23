/**
 * Payload sent to import the weather forecast of a plot from AgroMonitoring
 * (`POST /climate-forecasts/imports`).
 *
 * @remarks
 * The plot must belong to the user and have its monitoring polygon. The
 * platform records one forecast per day and issues the frost or water stress
 * alerts of the region, which are read from `/agroclimatic-alerts`.
 */
export interface ImportClimateForecastRequest {
  /** Plot whose polygon is used to ask for the forecast. */
  plotId: number;
}
