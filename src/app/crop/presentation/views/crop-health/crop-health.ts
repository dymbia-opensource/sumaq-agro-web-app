import { SatelliteImageryStore } from "../../../application/satellite-imagery.store";
import { SatelliteIndexTileLayer } from "../../../infrastructure/satellite-index-tile-layer";
import { Router } from "@angular/router";
import { DatePipe, DecimalPipe } from "@angular/common";
import {
  afterRenderEffect,
  Component,
  effect,
  ElementRef,
  inject,
  AfterViewInit,
  OnDestroy,
  signal,
  untracked,
  viewChild,
} from "@angular/core";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatRadioModule } from "@angular/material/radio";
import { FormsModule } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TranslateService, TranslatePipe } from "@ngx-translate/core";
import { CropStore } from "../../../application/crop.store";
import { CropPlotSelector } from "../../components/plot-selector/plot-selector";
import { observationImage } from "../../../infrastructure/observation-image";
import * as L from "leaflet";

@Component({
  selector: "app-crop-health",
  providers: [SatelliteImageryStore],
  imports: [
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatRadioModule,
    MatButtonToggleModule,
    CropPlotSelector,
  ],
  templateUrl: "./crop-health.html",
  styleUrl: "./crop-health.css",
})
export class CropHealth implements AfterViewInit, OnDestroy {
  readonly store = inject(CropStore);
  readonly imagery = inject(SatelliteImageryStore);
  readonly rasterLoading = signal(false);
  readonly rasterError = signal(false);
  readonly rasterVisible = signal(false);
  opacity = 80;
  private rasterLayer?: SatelliteIndexTileLayer;

  get selectedLayer(): "ndvi" | "ndwi" {
    return this.imagery.index() === "NDVI" ? "ndvi" : "ndwi";
  }
  set selectedLayer(value: "ndvi" | "ndwi") {
    this.imagery.index.set(value === "ndvi" ? "NDVI" : "NDWI");
  }
  get selectedMean(): number | null {
    const capture = this.store.latestObservation();
    return (
      (this.imagery.index() === "NDVI"
        ? capture?.ndviMean
        : capture?.ndwiMean) ?? null
    );
  }
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);
  readonly exportingImage = signal(false);
  private readonly mapContainer =
    viewChild.required<ElementRef<HTMLDivElement>>("mapContainer");
  private readonly mapReady = signal(false);
  private map?: L.Map;
  private sectorLayer?: L.LayerGroup;
  private readonly baseLayers = {
    satellite: L.layerGroup([
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          maxNativeZoom: 17,
          attribution: "Tiles © Esri — Esri, Maxar, Earthstar Geographics",
        },
      ),
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, maxNativeZoom: 17 },
      ),
    ]),
    streets: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }),
  };
  selectedBase: "satellite" | "streets" = "satellite";

  constructor() {
    effect(() => {
      const plot = this.store.selectedPlot();
      untracked(() => {
        if (plot) this.store.loadObservations(plot.id as number, true);
      });
    });
    afterRenderEffect(() => {
      this.store.selectedPlot();
      if (this.mapReady()) untracked(() => this.drawSector());
    });
    afterRenderEffect(() => {
      const metadata = this.imagery.metadata();
      const index = this.imagery.index();
      const plot = this.store.selectedPlot();
      if (this.mapReady()) untracked(() => this.drawImagery());
    });
  }
  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer().nativeElement, {
      zoomSnap: 0.25,
    }).setView([-9.19, -75.015], 5);
    this.map.createPane("satellite-index").style.zIndex = "350";
    this.baseLayers[this.selectedBase].addTo(this.map);
    this.mapReady.set(true);
  }
  ngOnDestroy(): void {
    this.map?.remove();
  }
  private drawSector(fitBounds = true): void {
    if (!this.map) return;
    if (this.sectorLayer) {
      this.map.removeLayer(this.sectorLayer);
      this.sectorLayer = undefined;
    }
    const plot = this.store.selectedPlot();
    if (!plot?.hasPolygon) {
      this.map.setView([-9.19, -75.015], 5);
      return;
    }
    const color = this.selectedLayer === "ndvi" ? "#16803c" : "#0369a1";
    const vertices = plot.boundary.map(
      (vertex) => [vertex.latitude, vertex.longitude] as L.LatLngTuple,
    );
    const outline = L.polygon(vertices, {
      color: "#ffffff",
      weight: 7,
      opacity: 0.95,
      fill: false,
      interactive: false,
    });
    const polygon = L.polygon(vertices, {
      color,
      weight: 3,
      opacity: 1,
      fillColor: color,
      fillOpacity: 0,
      lineJoin: "round",
      className: "crop-health-boundary",
    });
    const label = document.createElement("span");
    label.textContent =
      plot.name + " · " + plot.areaHectares.toFixed(2) + " ha";
    polygon.bindTooltip(label, { sticky: true });
    const corners = vertices.map((vertex) =>
      L.circleMarker(vertex, {
        radius: 4,
        color: "#ffffff",
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
        interactive: false,
      }),
    );
    this.sectorLayer = L.layerGroup([outline, polygon, ...corners]).addTo(
      this.map,
    );
    polygon.getElement()?.setAttribute("aria-label", label.textContent ?? plot.name);
    this.map.invalidateSize({ pan: false });
    if (fitBounds) {
      this.map.fitBounds(polygon.getBounds(), { padding: [64, 64], maxZoom: 18 });
    }
  }
  onBaseLayerChange(): void {
    const map = this.map;
    if (!map) return;
    Object.values(this.baseLayers).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    this.baseLayers[this.selectedBase].addTo(map);
  }
  onLayerChange(): void {
    this.drawSector(false);
  }
  onOpacityChange(value: string): void {
    this.opacity = Number(value);
    this.rasterLayer?.setOpacity(this.opacity / 100);
  }
  private drawImagery(): void {
    const map = this.map;
    if (!map) return;
    if (this.rasterLayer) map.removeLayer(this.rasterLayer);
    this.rasterLayer = undefined;
    this.rasterLoading.set(false);
    this.rasterError.set(false);
    this.rasterVisible.set(false);
    const plot = this.store.selectedPlot();
    if (!plot?.hasPolygon || !plot.boundary.length || !this.imagery.available())
      return;
    const index = this.imagery.index();
    const metadata = this.imagery.metadata()!;
    const bounds = L.latLngBounds(
      plot.boundary.map(
        (vertex) => [vertex.latitude, vertex.longitude] as L.LatLngTuple,
      ),
    );
    const layer = new SatelliteIndexTileLayer(
      (zoom, x, y) => this.imagery.readTile(zoom, x, y, metadata, index),
      plot.boundary.map(
        (vertex) => [vertex.latitude, vertex.longitude] as L.LatLngTuple,
      ),
      {
        pane: "satellite-index",
        bounds,
        opacity: this.opacity / 100,
        minZoom: 0,
        maxZoom: 22,
        maxNativeZoom: 18,
        tileSize: 256,
        keepBuffer: 0,
        updateWhenIdle: true,
        attribution: "Indices © AgroMonitoring",
      },
    );
    this.rasterLayer = layer;
    let successes = 0;
    layer.on("loading", () => {
      if (this.rasterLayer === layer) {
        successes = 0;
        this.rasterLoading.set(true);
        this.rasterError.set(false);
      }
    });
    layer.on("tileload", () => {
      if (this.rasterLayer === layer) {
        successes++;
        this.rasterVisible.set(true);
      }
    });
    layer.on("tileerror", () => {
      if (this.rasterLayer === layer) this.rasterError.set(true);
    });
    layer.on("load", () => {
      if (this.rasterLayer === layer) {
        this.rasterLoading.set(false);
        if (!successes) this.rasterError.set(true);
      }
    });
    layer.addTo(map);
  }
  consultAgronomist(): void {
    void this.router.navigate(["/pest-reports"]);
  }
  async downloadImage(): Promise<void> {
    const plot = this.store.selectedPlot();
    const observation = this.store.latestObservation();
    if (
      !plot ||
      !observation ||
      this.exportingImage() ||
      this.store.observationsLoading() ||
      this.store.observationsError()
    )
      return;
    this.exportingImage.set(true);
    try {
      const keys: Record<string, string> = {
        title: "image-title",
        plot: "plot",
        capture: "capture-date",
        area: "plot-area",
        source: "observation-source",
        clouds: "cloud-coverage",
        temperature: "surface-temperature",
        noData: "no-data",
        footer: "image-footer",
      };
      const labels = Object.fromEntries(
        Object.entries(keys).map(([key, value]) => [
          key,
          this.translate.instant("crop." + value),
        ]),
      );
      const blob = await observationImage(
        plot,
        observation,
        labels,
        this.translate.getCurrentLang() === "en" ? "en-US" : "es-PE",
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        "sumaqagro-" + plot.id + "-" + observation.date.slice(0, 10) + ".png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      this.snackBar.open(
        this.translate.instant("crop.image-error"),
        undefined,
        { duration: 6000 },
      );
    } finally {
      this.exportingImage.set(false);
    }
  }
}
