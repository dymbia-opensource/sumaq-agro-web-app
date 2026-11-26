import { SatelliteImagery } from "../../domain/model/entities/satellite-imagery.entity";
import { SatelliteIndex } from "../../domain/model/valueobjects/satellite-index";
import { SatelliteImageryAssembler } from "../assemblers/satellite-imagery.assembler";
import { SatelliteImageryResource } from "../responses/satellite-imagery.response";
import { HttpClient, HttpParams } from "@angular/common/http";
import { catchError, map, Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { BaseApiEndpoint } from "../../../shared/infrastructure/base-api-endpoint";
import { SatelliteObservation } from "../../domain/model/entities/satellite-observation.entity";
import { RequestSatelliteObservationImportCommand } from "../../domain/model/commands/request-satellite-observation-import.command";
import { SatelliteObservationAssembler } from "../assemblers/satellite-observation.assembler";
import {
  SatelliteObservationResource,
  SatelliteObservationsResponse,
} from "../responses/satellite-observation.response";

/**
 * HTTP endpoint for managing remote sensing and satellite data (`/satellite-observations`).
 */
export class SatelliteObservationsApiEndpoint extends BaseApiEndpoint<
  SatelliteObservation,
  SatelliteObservationResource,
  SatelliteObservationsResponse,
  SatelliteObservationAssembler
> {
  /**
   * Initializes the endpoint with the configured environment URL.
   * @param http - Angular's HttpClient.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSatelliteObservationsEndpointPath}`,
      new SatelliteObservationAssembler(),
    );
  }

  /**
   * Fetches all satellite observations associated with a specific plot.
   * @param plotId - The unique identifier of the plot.
   * @returns An observable of the domain entities.
   */
  getByPlot(plotId: number): Observable<SatelliteObservation[]> {
    const params = new HttpParams().set("plotId", plotId);
    return this.http
      .get<SatelliteObservationsResponse | SatelliteObservationResource[]>(
        this.endpointUrl,
        {
          params,
        },
      )
      .pipe(
        map((response) => this.toEntities(response)),
        catchError(this.handleError("Failed to fetch satellite observations")),
      );
  }
  /**
   * Searches the configured archive and returns the persisted capture with its original date.
   * HTTP errors reach the store so it can distinguish missing captures and provider failures.
   */
  requestImport(
    command: RequestSatelliteObservationImportCommand,
  ): Observable<SatelliteObservation> {
    const request = this.assembler.toRequestFromCommand(command);
    return this.http
      .post<SatelliteObservationResource>(
        this.endpointUrl + "/imports/latest",
        request,
      )
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  getImagery(
    plotId: number,
    observationId: number,
  ): Observable<SatelliteImagery> {
    return this.http
      .get<SatelliteImageryResource>(
        `${this.endpointUrl}/${observationId}/imagery`,
        {
          params: new HttpParams().set("plotId", plotId),
        },
      )
      .pipe(
        map((resource) =>
          new SatelliteImageryAssembler().toEntityFromResource(resource),
        ),
      );
  }

  getTile(
    plotId: number,
    observationId: number,
    index: SatelliteIndex,
    zoom: number,
    x: number,
    y: number,
  ): Observable<Blob> {
    return this.http.get(
      `${this.endpointUrl}/${observationId}/imagery/${index}/${zoom}/${x}/${y}`,
      {
        params: new HttpParams().set("plotId", plotId),
        responseType: "blob",
      },
    );
  }

  importLatest(
    plotId: number,
    start: string,
    end: string,
  ): Observable<SatelliteObservation> {
    return this.http
      .post<SatelliteObservationResource>(this.endpointUrl + "/imports", {
        plotId,
        start,
        end,
      })
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }
}
