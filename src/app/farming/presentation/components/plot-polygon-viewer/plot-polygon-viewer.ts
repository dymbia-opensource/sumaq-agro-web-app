import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';
import { GeoCoordinate } from '../../../domain/model/entities/field-plot.entity';

/** Center used when the plot has no polygon yet (Valle del Mantaro, Junín). */
const DEFAULT_CENTER: L.LatLngExpression = [-12.0725, -75.2121];

/**
 * Read-only satellite map with the polygon of a plot
 * (`SatelliteMapAndCadastreViewer` read model).
 */
@Component({
  selector: 'app-plot-polygon-viewer',
  imports: [MatCardModule, TranslatePipe],
  templateUrl: './plot-polygon-viewer.html',
  styleUrl: './plot-polygon-viewer.css',
})
export class PlotPolygonViewer implements AfterViewInit, OnDestroy {
  private readonly mapElement = viewChild.required<ElementRef<HTMLDivElement>>('mapElement');
  private map?: L.Map;
  private readonly polygonLayer = L.layerGroup();

  /** Vertices of the polygon, in order. */
  readonly coordinates = input.required<GeoCoordinate[]>();

  constructor() {
    effect(() => this.draw(this.coordinates()));
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement().nativeElement, {
      center: DEFAULT_CENTER,
      zoom: 15,
      scrollWheelZoom: false,
    });
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        maxNativeZoom: 17,
        attribution: 'Tiles © Esri — Esri, Maxar, Earthstar Geographics',
      },
    ).addTo(this.map);
    this.polygonLayer.addTo(this.map);
    this.draw(this.coordinates());
    // Leaflet measures the container before the layout settles; measure again.
    setTimeout(() => this.map?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  /** Draws the polygon and centers the map on it. */
  private draw(coordinates: GeoCoordinate[]) {
    if (!this.map) return;
    this.polygonLayer.clearLayers();
    if (coordinates.length < 3) return;
    const points: L.LatLngExpression[] = coordinates.map((v) => [v.latitude, v.longitude]);
    const polygon = L.polygon(points, { color: '#4caf50', weight: 3, fillOpacity: 0.3 });
    polygon.addTo(this.polygonLayer);
    this.map.fitBounds(polygon.getBounds(), { padding: [32, 32], maxZoom: 18 });
  }
}
