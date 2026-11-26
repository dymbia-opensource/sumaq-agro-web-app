import * as L from "leaflet";
import { Observable, Subscription } from "rxjs";

interface TileState {
  subscription?: Subscription;
  url?: string;
  removed: boolean;
}

/** Loads protected tiles through HttpClient so IAM headers are never put in image URLs. */
export class SatelliteIndexTileLayer extends L.GridLayer {
  private readonly pending = new Map<HTMLElement, TileState>();
  constructor(
    private readonly readTile: (
      zoom: number,
      x: number,
      y: number,
    ) => Observable<Blob>,
    private readonly boundary: readonly L.LatLngTuple[],
    options: L.GridLayerOptions,
  ) {
    super(options);
    this.on("tileunload", (event: L.TileEvent) => this.release(event.tile));
  }
  override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const image = document.createElement("img");
    image.alt = "";
    image.setAttribute("role", "presentation");
    // Provider tiles can have an opaque background. Clip using the same Web Mercator grid.
    image.style.clipPath =
      "polygon(" +
      this.boundary
        .map((vertex) => {
          const point = L.CRS.EPSG3857.latLngToPoint(
            L.latLng(vertex),
            coords.z,
          );
          return `${point.x - coords.x * 256}px ${point.y - coords.y * 256}px`;
        })
        .join(",") +
      ")";

    const state: TileState = { removed: false };
    this.pending.set(image, state);
    const fail = () => {
      if (state.removed) return;
      image.style.visibility = "hidden";
      done(new Error("Satellite tile unavailable"), image);
    };
    state.subscription = this.readTile(coords.z, coords.x, coords.y).subscribe({
      next: (blob) => {
        if (state.removed) return;
        if (blob.type !== "image/png") {
          fail();
          return;
        }
        state.url = URL.createObjectURL(blob);
        image.onload = () => {
          if (!state.removed) done(undefined, image);
        };
        image.onerror = fail;
        image.src = state.url;
      },
      error: fail,
    });
    return image;
  }
  override onRemove(map: L.Map): this {
    for (const image of [...this.pending.keys()]) this.release(image);
    return super.onRemove(map);
  }
  private release(image: HTMLElement): void {
    const state = this.pending.get(image);
    if (!state) return;
    state.removed = true;
    state.subscription?.unsubscribe();
    if (state.url) URL.revokeObjectURL(state.url);
    this.pending.delete(image);
  }
}
