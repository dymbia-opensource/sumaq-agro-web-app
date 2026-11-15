import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export enum CropType {
  ANDEAN_POTATO = 'ANDEAN_POTATO',
  SPECIALTY_COFFEE = 'SPECIALTY_COFFEE',
}

export enum CampaignStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

/** Crop campaign of a plot (crop, seed variety and sowing date). */
export class CropCampaign extends BaseEntity {
  private _plotId: number;
  private _season: string;
  private _cropType: CropType;
  private _seedVariety: string;
  private _customSeedVariety: boolean;
  private _sowingDate: Date | null;
  private _status: CampaignStatus;

  constructor(props: {
    id: number;
    plotId: number;
    season: string;
    cropType: CropType;
    seedVariety: string;
    customSeedVariety?: boolean;
    sowingDate?: Date | null;
    status?: CampaignStatus;
  }) {
    super({ id: props.id });
    this._plotId = props.plotId;
    this._season = props.season;
    this._cropType = props.cropType;
    this._seedVariety = props.seedVariety;
    this._customSeedVariety = props.customSeedVariety ?? false;
    this._sowingDate = props.sowingDate ?? null;
    this._status = props.status ?? CampaignStatus.IN_PROGRESS;
  }

  get plotId(): number {
    return this._plotId;
  }

  set plotId(value: number) {
    this._plotId = value;
  }

  /** e.g. 2026-I */
  get season(): string {
    return this._season;
  }

  set season(value: string) {
    this._season = value;
  }

  get cropType(): CropType {
    return this._cropType;
  }

  set cropType(value: CropType) {
    this._cropType = value;
  }

  get seedVariety(): string {
    return this._seedVariety;
  }

  set seedVariety(value: string) {
    this._seedVariety = value;
  }

  /** The producer typed a variety that is not in the list. */
  get customSeedVariety(): boolean {
    return this._customSeedVariety;
  }

  set customSeedVariety(value: boolean) {
    this._customSeedVariety = value;
  }

  get sowingDate(): Date | null {
    return this._sowingDate;
  }

  set sowingDate(value: Date | null) {
    this._sowingDate = value;
  }

  get status(): CampaignStatus {
    return this._status;
  }

  set status(value: CampaignStatus) {
    this._status = value;
  }

  isActive(): boolean {
    return this._status === CampaignStatus.IN_PROGRESS;
  }
}
