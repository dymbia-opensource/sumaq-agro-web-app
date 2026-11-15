import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';
import { GeoCoordinate } from '../../../domain/model/entities/field-plot.entity';
import { PolygonStatus } from '../boundary-summary-panel/boundary-summary-panel';

/** Minimum number of vertices of a polygon. */
export const MINIMUM_VERTICES = 3;

/**
 * Area of a GPS polygon in hectares, with the shoelace formula.
 *
 * @remarks
 * The coordinates are projected to meters around the center of the polygon,
 * which is precise enough for the size of a farm plot.
 *
 * @param coordinates - Vertices of the polygon, in order.
 */
export function polygonAreaHectares(coordinates: GeoCoordinate[]): number {
  if (coordinates.length < MINIMUM_VERTICES) return 0;
  const meanLatitude =
    coordinates.reduce((sum, vertex) => sum + vertex.latitude, 0) / coordinates.length;
  const metersPerDegreeLatitude = 110_540;
  const metersPerDegreeLongitude = 111_320 * Math.cos((meanLatitude * Math.PI) / 180);
  const points = coordinates.map((vertex) => ({
    x: vertex.longitude * metersPerDegreeLongitude,
    y: vertex.latitude * metersPerDegreeLatitude,
  }));
  const doubleArea = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  return Math.abs(doubleArea) / 2 / 10_000;
}

/**
 * Tells whether the sides of a polygon do not cross each other (US-29).
 * @param coordinates - Vertices of the polygon, in order.
 */
export function isSimplePolygon(coordinates: GeoCoordinate[]): boolean {
  const total = coordinates.length;
  for (let i = 0; i < total; i++) {
    for (let j = i + 1; j < total; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === total - 1);
      if (
        !adjacent &&
        segmentsCross(
          coordinates[i],
          coordinates[(i + 1) % total],
          coordinates[j],
          coordinates[(j + 1) % total],
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

/** `true` when the segment a-b crosses the segment c-d. */
function segmentsCross(
  a: GeoCoordinate,
  b: GeoCoordinate,
  c: GeoCoordinate,
  d: GeoCoordinate,
): boolean {
  const orientation = (p: GeoCoordinate, q: GeoCoordinate, r: GeoCoordinate) =>
    Math.sign(
      (q.longitude - p.longitude) * (r.latitude - p.latitude) -
        (q.latitude - p.latitude) * (r.longitude - p.longitude),
    );
  return (
    orientation(a, b, c) * orientation(a, b, d) < 0 &&
    orientation(c, d, a) * orientation(c, d, b) < 0
  );
}

/** Center used when the plot has no polygon yet (Valle del Mantaro, Junín). */
const DEFAULT_CENTER: L.LatLngExpression = [-12.0725, -75.2121];

/** Base layers of the map. */
type MapLayer = 'satellite' | 'streets';

/** Satellite map (Leaflet) where the producer marks the corners of the plot (US-30). */
@Component({
  selector: 'app-plot-boundary-map',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './plot-boundary-map.html',
  styleUrl: './plot-boundary-map.css',
})
export class PlotBoundaryMap implements AfterViewInit, OnDestroy {
  private readonly mapElement = viewChild.required<ElementRef<HTMLDivElement>>('mapElement');

  private map?: L.Map;
  private readonly baseLayers: Record<MapLayer, L.Layer> = {
    satellite: L.layerGroup([
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          maxNativeZoom: 17,
          attribution: 'Tiles © Esri — Esri, Maxar, Earthstar Geographics',
        },
      ),
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 17 },
      ),
    ]),
    streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }),
  };
  private readonly drawingLayer = L.layerGroup();

  /** Vertices marked on the map, in order. */
  readonly coordinates = input.required<GeoCoordinate[]>();

  /** Open, closed or crossed polygon; a crossed one is drawn in red. */
  readonly status = input.required<PolygonStatus>();

  /** The producer marked a new corner. */
  readonly vertexAdded = output<GeoCoordinate>();

  /** Base layer shown on the map. */
  readonly layer = signal<MapLayer>('satellite');

  /** Message of the coordinate search or of the GPS location. */
  readonly searchMessage = signal<string | null>(null);

  protected readonly minimumVertices = MINIMUM_VERTICES;

  constructor() {
    // Redraw the polygon every time a vertex changes.
    effect(() => this.drawPolygon(this.coordinates(), this.status()));

    // Change the base layer.
    effect(() => this.showLayer(this.layer()));
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement().nativeElement, { center: DEFAULT_CENTER, zoom: 17 });
    this.drawingLayer.addTo(this.map);
    this.showLayer(this.layer());
    this.map.on('click', (event: L.LeafletMouseEvent) =>
      this.vertexAdded.emit(new GeoCoordinate(event.latlng.lat, event.latlng.lng)),
    );
    this.drawPolygon(this.coordinates(), this.status());
    this.fitTo(this.coordinates());
    // Leaflet measures the container before the layout settles; measure again.
    setTimeout(() => this.map?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  /** Centers the map on the polygon (the view calls it after loading). */
  fitTo(coordinates: GeoCoordinate[]) {
    if (!this.map || coordinates.length === 0) return;
    const bounds = L.latLngBounds(coordinates.map((v) => [v.latitude, v.longitude]));
    this.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
  }

  /** Moves the map to coordinates typed as "latitude, longitude". */
  onSearch(text: string) {
    const parts = text.split(',').map((part) => Number(part.trim()));
    const [latitude, longitude] = parts;
    const valid =
      parts.length === 2 &&
      parts.every((part) => Number.isFinite(part)) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180;
    if (!valid) {
      this.searchMessage.set('farming.boundary.search-invalid');
      return;
    }
    this.searchMessage.set(null);
    this.map?.setView([latitude, longitude], 17);
  }

  /** Adds the phone's GPS location as a corner. */
  onUseMyLocation() {
    this.searchMessage.set(null);
    if (!navigator.geolocation) {
      this.searchMessage.set('farming.boundary.location-unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.vertexAdded.emit(new GeoCoordinate(coords.latitude, coords.longitude));
        this.map?.setView([coords.latitude, coords.longitude], 18);
      },
      () => this.searchMessage.set('farming.boundary.location-denied'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  /** Shows one base layer and hides the other. */
  private showLayer(layer: MapLayer) {
    if (!this.map) return;
    Object.entries(this.baseLayers).forEach(([name, baseLayer]) => {
      if (name === layer) {
        baseLayer.addTo(this.map!);
      } else {
        baseLayer.remove();
      }
    });
  }

  /** Draws the polygon (red when the sides cross) and the V1, V2... labels. */
  private drawPolygon(coordinates: GeoCoordinate[], status: PolygonStatus) {
    this.drawingLayer.clearLayers();
    const points: L.LatLngExpression[] = coordinates.map((v) => [v.latitude, v.longitude]);
    const color = status === 'CROSSED' ? '#e53935' : '#4caf50';
    if (points.length >= 2) {
      const shape =
        points.length >= MINIMUM_VERTICES
          ? L.polygon(points, { color, weight: 3, fillOpacity: 0.3 })
          : L.polyline(points, { color, weight: 3 });
      shape.addTo(this.drawingLayer);
    }
    points.forEach((point, index) =>
      L.circleMarker(point, {
        radius: 7,
        color: '#1b5e20',
        weight: 2,
        fillColor: '#ffffff',
        fillOpacity: 1,
      })
        .bindTooltip(`V${index + 1}`, {
          permanent: true,
          direction: 'top',
          offset: [0, -8],
          className: 'vertex-label',
        })
        .addTo(this.drawingLayer),
    );
  }
}
