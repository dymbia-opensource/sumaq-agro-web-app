/**
 * Payload for POST /satellite-observations/imports/latest.
 * The API resolves the requesting user from the session token.
 */
export interface RequestSatelliteObservationImportRequest {
  plotId: number;
}
