import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from "@angular/core";
import { Observable, Subscription, throwError } from "rxjs";
import { CropStore } from "./crop.store";
import { CropApi } from "../infrastructure/crop-api";
import { SatelliteImagery } from "../domain/model/entities/satellite-imagery.entity";
import { SatelliteIndex } from "../domain/model/valueobjects/satellite-index";

/** Keeps the raster viewer scoped to the current participant, plot and saved capture. */
@Injectable()
export class SatelliteImageryStore {
  private readonly crop = inject(CropStore);
  private readonly api = inject(CropApi);
  private request?: Subscription;
  private generation = 0;
  readonly metadata = signal<SatelliteImagery | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly index = signal<SatelliteIndex>("NDVI");
  readonly available = computed(
    () => this.metadata()?.availableIndices.includes(this.index()) ?? false,
  );

  constructor() {
    effect(() => {
      const plot = this.crop.selectedPlot();
      const capture = this.crop.latestObservation();
      const user = this.crop.activeUser();
      untracked(() =>
        this.load(
          plot?.id ?? null,
          capture ? Number(capture.id) : null,
          capture?.date,
          capture?.source,
          user?.id,
        ),
      );
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      this.request?.unsubscribe();
    });
  }
  private load(
    plotId: number | null,
    observationId: number | null,
    date?: string,
    source?: string,
    userId?: number,
  ): void {
    this.request?.unsubscribe();
    const generation = ++this.generation;
    this.metadata.set(null);
    this.error.set(null);
    this.loading.set(false);
    if (!plotId || !observationId || !date || !userId) return;
    this.loading.set(true);
    this.request = this.api
      .getSatelliteImagery(plotId, observationId)
      .subscribe({
        next: (data) => {
          if (generation !== this.generation) return;
          this.loading.set(false);
          if (
            data.plotId !== plotId ||
            data.observationId !== observationId ||
            Date.parse(data.capturedAt) !== Date.parse(date) ||
            data.source !== source
          ) {
            this.error.set("crop.errors.imagery-mismatch");
            return;
          }
          this.metadata.set(data);
        },
        error: () => {
          if (generation === this.generation) {
            this.loading.set(false);
            this.error.set("crop.errors.imagery-load");
          }
        },
      });
  }
  retry(): void {
    const capture = this.crop.latestObservation();
    this.load(
      this.crop.selectedPlot()?.id ?? null,
      capture ? Number(capture.id) : null,
      capture?.date,
      capture?.source,
      this.crop.activeUser()?.id,
    );
  }
  readTile(
    zoom: number,
    x: number,
    y: number,
    expected = this.metadata(),
    index = this.index(),
  ): Observable<Blob> {
    const capture = this.metadata();
    if (
      !capture ||
      capture !== expected ||
      index !== this.index() ||
      !this.available()
    )
      return throwError(() => new Error("crop.errors.imagery-load"));
    return this.api.getSatelliteTile(
      capture.plotId,
      capture.observationId,
      index,
      zoom,
      x,
      y,
    );
  }
}
