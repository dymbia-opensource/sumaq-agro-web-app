import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/** One month in the institutional NDVI trend projection. */
export interface NdviTrendPoint {
  month: string;
  value: number;
}

/** Read-only institutional projection for the cooperative director dashboard. */
export class CooperativeDashboard extends BaseEntity {
  constructor(props: {
    id: number;
    directorUserId: number;
    cooperativeName: string;
    campaignName: string;
    activeMembers: number;
    monitoredHectares: number;
    collectionTons: number;
    collectionGoalTons: number;
    optimalPlotsPercentage: number;
    stressedPlotsPercentage: number;
    averageCostPerHectare: number;
    ndviTrend: NdviTrendPoint[];
    evaluatedLots: number;
    specialtyCoffeePercentage: number;
    firstGradePotatoPercentage: number;
    lossLotsPercentage: number;
  }) {
    super({ id: props.id });
    this.directorUserId = props.directorUserId;
    this.cooperativeName = props.cooperativeName;
    this.campaignName = props.campaignName;
    this.activeMembers = props.activeMembers;
    this.monitoredHectares = props.monitoredHectares;
    this.collectionTons = props.collectionTons;
    this.collectionGoalTons = props.collectionGoalTons;
    this.optimalPlotsPercentage = props.optimalPlotsPercentage;
    this.stressedPlotsPercentage = props.stressedPlotsPercentage;
    this.averageCostPerHectare = props.averageCostPerHectare;
    this.ndviTrend = props.ndviTrend;
    this.evaluatedLots = props.evaluatedLots;
    this.specialtyCoffeePercentage = props.specialtyCoffeePercentage;
    this.firstGradePotatoPercentage = props.firstGradePotatoPercentage;
    this.lossLotsPercentage = props.lossLotsPercentage;
  }

  readonly directorUserId: number;
  readonly cooperativeName: string;
  readonly campaignName: string;
  readonly activeMembers: number;
  readonly monitoredHectares: number;
  readonly collectionTons: number;
  readonly collectionGoalTons: number;
  readonly optimalPlotsPercentage: number;
  readonly stressedPlotsPercentage: number;
  readonly averageCostPerHectare: number;
  readonly ndviTrend: NdviTrendPoint[];
  readonly evaluatedLots: number;
  readonly specialtyCoffeePercentage: number;
  readonly firstGradePotatoPercentage: number;
  readonly lossLotsPercentage: number;

  get collectionProgress(): number {
    return this.collectionGoalTons === 0
      ? 0
      : (this.collectionTons / this.collectionGoalTons) * 100;
  }
}
