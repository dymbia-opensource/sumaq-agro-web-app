import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { FieldManagementStore } from '../../../application/field-management.store';
import { DelineatePlotBoundaryCommand } from '../../../domain/model/commands/delineate-plot-boundary.command';
import { FieldPlot, GeoCoordinate } from '../../../domain/model/entities/field-plot.entity';
import {
  isSimplePolygon,
  MINIMUM_VERTICES,
  polygonAreaHectares,
} from '../../components/plot-boundary-map/plot-boundary-map';
import {
  BoundarySummaryPanel,
  PolygonStatus,
} from '../../components/boundary-summary-panel/boundary-summary-panel';
import { PlotBoundaryMap } from '../../components/plot-boundary-map/plot-boundary-map';
import {
  PlotSavedDialog,
  PlotSavedDialogData,
  PlotSavedDialogResult,
} from '../../components/plot-saved-dialog/plot-saved-dialog';
import { RegistrationSteps } from '../../components/registration-steps/registration-steps';

/** Step 2 of 2: the producer marks the corners of the plot on the map (US-29, US-30). */
@Component({
  selector: 'app-plot-boundary-map-view',
  imports: [
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    RegistrationSteps,
    PlotBoundaryMap,
    BoundarySummaryPanel,
  ],
  templateUrl: './plot-boundary-map-view.html',
  styleUrl: './plot-boundary-map-view.css',
})
export class PlotBoundaryMapView {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private fieldManagementStore = inject(FieldManagementStore);

  private readonly boundaryMap = viewChild(PlotBoundaryMap);
  private loadedPlotId: number | null = null;

  // Store state
  readonly loading = this.fieldManagementStore.loading;
  readonly error = this.fieldManagementStore.error;

  /** ID taken from the route `plots/:id/boundary`. */
  plotId = 0;

  readonly plot = computed(() => this.fieldManagementStore.getPlotById(this.plotId)());

  readonly campaign = computed(() =>
    this.fieldManagementStore.getCurrentCampaignOf(this.plotId)(),
  );

  // UI state
  /** Title, e.g. "Pampa Alta (Papa Yungay)". */
  readonly plotTitle = computed(() => {
    const variety = this.campaign()?.seedVariety;
    return `${this.plot()?.name ?? ''}${variety ? ` (${variety})` : ''}`;
  });

  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.my-plot', link: '/dashboard' },
    { label: 'field-management.plots.manage', link: '/field-management/plots' },
    { label: 'field-management.steps.crop-data' },
    { label: 'field-management.steps.map-title' },
  ];

  /** Corners marked so far, in order. */
  readonly markedCoordinates = signal<GeoCoordinate[]>([]);

  /** Area of the polygon, in hectares (US-29). */
  readonly areaHectares = computed(() =>
    polygonAreaHectares(this.markedCoordinates()),
  );

  /** OPEN: fewer than 3 corners, CROSSED: sides cross, CLOSED: ready to save. */
  readonly polygonStatus = computed<PolygonStatus>(() => {
    const coordinates = this.markedCoordinates();
    if (coordinates.length < MINIMUM_VERTICES) return 'OPEN';
    return isSimplePolygon(coordinates) ? 'CLOSED' : 'CROSSED';
  });

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.plotId = +params['id'];
    });

    // Show the saved polygon once the plot arrives from the store.
    effect(() => {
      const plot = this.plot();
      if (plot && this.loadedPlotId !== plot.id) {
        this.loadedPlotId = plot.id as number;
        this.markedCoordinates.set(plot.boundary);
        this.boundaryMap()?.fitTo(plot.boundary);
      }
    });
  }

  // Actions
  onAddVertex(coordinate: GeoCoordinate) {
    this.markedCoordinates.update((coordinates) => [...coordinates, coordinate]);
  }

  onUndo() {
    this.markedCoordinates.update((coordinates) => coordinates.slice(0, -1));
  }

  onClear() {
    this.markedCoordinates.set([]);
  }

  /** Saves the polygon, which starts the satellite monitoring. */
  onSavePlot() {
    if (this.polygonStatus() !== 'CLOSED') return;
    this.fieldManagementStore.delineateBoundary(
      new DelineatePlotBoundaryCommand({
        plotId: this.plotId,
        coordinates: this.markedCoordinates(),
        areaHectares: this.areaHectares(),
      }),
      (plot) => this.showSavedDialog(plot),
    );
  }

  /** Shows the success dialog and goes where the producer chooses. */
  private showSavedDialog(plot: FieldPlot) {
    const data: PlotSavedDialogData = {
      plot,
      seedVariety: this.campaign()?.seedVariety,
      plotCount: this.fieldManagementStore.plotCount(),
      plotQuota: this.fieldManagementStore.plotQuota(),
    };
    this.dialog
      .open<PlotSavedDialog, PlotSavedDialogData, PlotSavedDialogResult>(PlotSavedDialog, {
        data,
        disableClose: true,
        autoFocus: false,
        maxWidth: '560px',
        width: 'calc(100vw - 32px)',
        panelClass: 'saved-plot-dialog',
      })
      .afterClosed()
      .subscribe((result) => {
        const route = result === 'crop-health' ? 'crop-health/monitoring' : 'field-management/plots';
        this.router.navigate([route]).then();
      });
  }
}
