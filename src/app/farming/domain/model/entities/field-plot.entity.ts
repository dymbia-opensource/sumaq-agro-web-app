import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export enum PlotStatus {
  WITHOUT_POLYGON = 'WITHOUT_POLYGON', // polygon not drawn yet
  ACTIVE_MONITORING = 'ACTIVE_MONITORING', // polygon linked to AgroMonitoring
}

export enum SoilTexture {
  SANDY = 'SANDY',
  LOAMY = 'LOAMY',
  CLAY = 'CLAY',
  SILTY = 'SILTY',
  SANDY_LOAM = 'SANDY_LOAM',
  CLAY_LOAM = 'CLAY_LOAM',
}

/** A point of the plot polygon. */
export class GeoCoordinate {
  private _latitude: number;
  private _longitude: number;

  constructor(latitude: number, longitude: number) {
    this._latitude = latitude;
    this._longitude = longitude;
  }

  get latitude(): number {
    return this._latitude;
  }

  set latitude(value: number) {
    this._latitude = value;
  }

  get longitude(): number {
    return this._longitude;
  }

  set longitude(value: number) {
    this._longitude = value;
  }
}

/** First soil analysis of the plot. */
export class SoilBaseline {
  private _ph: number;
  private _texture: SoilTexture;
  private _organicMatterPercentage: number;
  private _recordedAt: Date;

  constructor(props: {
    ph: number;
    texture: SoilTexture;
    organicMatterPercentage: number;
    recordedAt: Date;
  }) {
    this._ph = props.ph;
    this._texture = props.texture;
    this._organicMatterPercentage = props.organicMatterPercentage;
    this._recordedAt = props.recordedAt;
  }

  get ph(): number {
    return this._ph;
  }

  set ph(value: number) {
    this._ph = value;
  }

  get texture(): SoilTexture {
    return this._texture;
  }

  set texture(value: SoilTexture) {
    this._texture = value;
  }

  get organicMatterPercentage(): number {
    return this._organicMatterPercentage;
  }

  set organicMatterPercentage(value: number) {
    this._organicMatterPercentage = value;
  }

  get recordedAt(): Date {
    return this._recordedAt;
  }

  set recordedAt(value: Date) {
    this._recordedAt = value;
  }
}

/** Plot of a producer, with its GPS polygon and soil analysis. */
export class FieldPlot extends BaseEntity {
  private _ownerUserId: number;
  private _name: string;
  private _region: string;
  private _status: PlotStatus;
  private _boundary: GeoCoordinate[];
  private _areaHectares: number;
  private _agroMonitoringPolygonId: string | null;
  private _soilBaseline: SoilBaseline | null;

  constructor(props: {
    id: number;
    ownerUserId: number;
    name: string;
    region: string;
    status?: PlotStatus;
    boundary?: GeoCoordinate[];
    areaHectares?: number;
    agroMonitoringPolygonId?: string | null;
    soilBaseline?: SoilBaseline | null;
  }) {
    super({ id: props.id });
    this._ownerUserId = props.ownerUserId;
    this._name = props.name;
    this._region = props.region;
    this._status = props.status ?? PlotStatus.WITHOUT_POLYGON;
    this._boundary = props.boundary ?? [];
    this._areaHectares = props.areaHectares ?? 0;
    this._agroMonitoringPolygonId = props.agroMonitoringPolygonId ?? null;
    this._soilBaseline = props.soilBaseline ?? null;
  }

  get ownerUserId(): number {
    return this._ownerUserId;
  }

  set ownerUserId(value: number) {
    this._ownerUserId = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get region(): string {
    return this._region;
  }

  set region(value: string) {
    this._region = value;
  }

  get status(): PlotStatus {
    return this._status;
  }

  set status(value: PlotStatus) {
    this._status = value;
  }

  get boundary(): GeoCoordinate[] {
    return this._boundary;
  }

  set boundary(value: GeoCoordinate[]) {
    this._boundary = value;
  }

  get areaHectares(): number {
    return this._areaHectares;
  }

  set areaHectares(value: number) {
    this._areaHectares = value;
  }

  get agroMonitoringPolygonId(): string | null {
    return this._agroMonitoringPolygonId;
  }

  set agroMonitoringPolygonId(value: string | null) {
    this._agroMonitoringPolygonId = value;
  }

  /** null until the soil analysis is recorded. */
  get soilBaseline(): SoilBaseline | null {
    return this._soilBaseline;
  }

  set soilBaseline(value: SoilBaseline | null) {
    this._soilBaseline = value;
  }

  /** At least 3 points. Crop Health also uses it. */
  hasPolygon(): boolean {
    return this._boundary.length >= 3;
  }

  isMonitored(): boolean {
    return this._status === PlotStatus.ACTIVE_MONITORING;
  }
}
