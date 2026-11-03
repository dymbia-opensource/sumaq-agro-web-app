import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { afterRenderEffect, Component, effect, ElementRef, inject, AfterViewInit, OnDestroy, signal, untracked, viewChild } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';
import { CropPlotSelector } from '../../components/plot-selector/plot-selector';
import { observationImage } from '../../../infrastructure/observation-image';
import * as L from 'leaflet';

@Component({
  selector: 'app-crop-health-view',
  imports: [DatePipe, DecimalPipe, TranslatePipe, FormsModule, MatButtonModule, MatCardModule,
    MatIconModule, MatProgressBarModule, MatRadioModule, MatButtonToggleModule, CropPlotSelector],
  templateUrl: './crop-health-view.html', styleUrl: './crop-health-view.css',
})
export class CropHealthView implements AfterViewInit, OnDestroy {
  readonly store = inject(CropHealthStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);
  readonly exportingImage = signal(false);
  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private readonly mapReady = signal(false);
  private map?: L.Map;
  private sectorLayer?: L.LayerGroup;
  private readonly baseLayers = {
    satellite: L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, maxNativeZoom: 17, attribution: 'Tiles © Esri — Esri, Maxar, Earthstar Geographics',
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, maxNativeZoom: 17 }),
    ]),
    streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }),
  };
  selectedBase: 'satellite' | 'streets' = 'satellite';
  selectedLayer: 'ndvi' | 'ndwi' = 'ndvi';

  constructor() {
    effect(() => {
      const plot = this.store.selectedPlot();
      untracked(() => { if (plot) this.store.loadObservations(plot.id as number); });
    });
    afterRenderEffect(() => {
      this.store.selectedPlot();
      if (this.mapReady()) untracked(() => this.drawSector());
    });
  }
  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer().nativeElement, { zoomSnap: 0.25 }).setView([-9.19, -75.015], 5);
    this.baseLayers[this.selectedBase].addTo(this.map);
    this.mapReady.set(true);
  }
  ngOnDestroy(): void { this.map?.remove(); }
  private drawSector(): void {
    if (!this.map) return;
    if (this.sectorLayer) { this.map.removeLayer(this.sectorLayer); this.sectorLayer = undefined; }
    const plot = this.store.selectedPlot();
    if (!plot?.hasPolygon()) { this.map.setView([-9.19, -75.015], 5); return; }
    const color = this.selectedLayer === 'ndvi' ? '#16803c' : '#0369a1';
    const vertices = plot.boundary.map(vertex => [vertex.latitude, vertex.longitude] as L.LatLngTuple);
    const outline = L.polygon(vertices, { color: '#ffffff', weight: 7, opacity: 0.95, fill: false, interactive: false });
    const polygon = L.polygon(vertices, {
      color, weight: 3, opacity: 1, fillColor: color, fillOpacity: 0.16, lineJoin: 'round',
    });
    const label = document.createElement('span');
    label.textContent = plot.name + ' · ' + plot.areaHectares.toFixed(2) + ' ha';
    polygon.bindTooltip(label, { sticky: true });
    const corners = vertices.map(vertex => L.circleMarker(vertex, {
      radius: 4, color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1, interactive: false,
    }));
    this.sectorLayer = L.layerGroup([outline, polygon, ...corners]).addTo(this.map);
    this.map.invalidateSize();
    this.map.fitBounds(polygon.getBounds(), { padding: [64, 64], maxZoom: 18 });
  }
  onBaseLayerChange(): void {
    const map = this.map;
    if (!map) return;
    Object.values(this.baseLayers).forEach(layer => { if (map.hasLayer(layer)) map.removeLayer(layer); });
    this.baseLayers[this.selectedBase].addTo(map);
  }
  onLayerChange(): void { this.drawSector(); }
  consultAgronomist(): void { void this.router.navigate(['/crop-health/inbox']); }
  async downloadImage(): Promise<void> {
    const plot = this.store.selectedPlot();
    const observation = this.store.latestObservation();
    if (!plot || !observation || this.exportingImage() || this.store.observationsLoading() || this.store.observationsError()) return;
    this.exportingImage.set(true);
    try {
      const keys: Record<string, string> = { title: 'image-title', plot: 'plot', capture: 'capture-date', area: 'plot-area', stress: 'stress-detected', clouds: 'cloud-coverage', temperature: 'surface-temperature', recommendation: 'recommendation', noData: 'no-data', footer: 'image-footer' };
      const labels = Object.fromEntries(Object.entries(keys).map(([key, value]) => [key, this.translate.instant('crop-health.' + value)]));
      const blob = await observationImage(plot, observation, labels, this.translate.getCurrentLang() === 'en' ? 'en-US' : 'es-PE');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'sumaqagro-' + plot.id + '-' + observation.date.slice(0, 10) + '.png';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      this.snackBar.open(this.translate.instant('crop-health.image-error'), undefined, { duration: 6000 });
    } finally { this.exportingImage.set(false); }
  }
}
