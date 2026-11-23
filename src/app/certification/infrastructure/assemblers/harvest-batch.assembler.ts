import { ExtractRepresentativeSampleCommand } from '../../domain/model/commands/extract-representative-sample.command';
import { GradePotatoCalibersCommand } from '../../domain/model/commands/grade-potato-calibers.command';
import { PerformCoffeeCuppingCommand } from '../../domain/model/commands/perform-coffee-cupping.command';
import { RegisterHarvestBatchCommand } from '../../domain/model/commands/register-harvest-batch.command';
import { WeighDeliveredBatchCommand } from '../../domain/model/commands/weigh-delivered-batch.command';
import { BatchEntry } from '../../domain/model/entities/batch-entry';
import { BatchStatus } from '../../domain/model/entities/batch-status';
import { HarvestCropType } from '../../domain/model/entities/crop-type';
import { HarvestBatch } from '../../domain/model/entities/harvest-batch.entity';
import { QualityCategory } from '../../domain/model/entities/quality-category';
import { CupCoffeeRequest } from '../requests/cup-coffee.request';
import { ExtractRepresentativeSampleRequest } from '../requests/extract-representative-sample.request';
import { GradePotatoCalibersRequest } from '../requests/grade-potato-calibers.request';
import { RegisterHarvestBatchRequest } from '../requests/register-harvest-batch.request';
import { WeighHarvestBatchRequest } from '../requests/weigh-harvest-batch.request';
import { BatchEntryResource, HarvestBatchResource } from '../responses/harvest-batch.response';
import { QualityCertificateAssembler } from './quality-certificate.assembler';

/** Maps harvest batches to and from the API, and the batch commands to their requests. */
export class HarvestBatchAssembler {
  private readonly certificates = new QualityCertificateAssembler();

  /**
   * Converts a batch resource into the domain entity.
   * @param resource - Batch returned by the API.
   */
  toEntityFromResource = (resource: HarvestBatchResource): HarvestBatch =>
    new HarvestBatch({
      id: resource.id,
      batchCode: resource.batchCode,
      cooperativeId: resource.cooperativeId,
      memberId: resource.memberId,
      plotId: resource.plotId,
      cropType: resource.cropType as HarvestCropType,
      harvestedOn: resource.harvestedOn,
      status: resource.status as BatchStatus,
      netWeightKg: resource.netWeightKg,
      sampleIdentifier: resource.sampleIdentifier,
      sampleWeightKg: resource.sampleWeightKg,
      qualityScore: resource.qualityScore,
      qualityCategory: resource.qualityCategory as QualityCategory | null,
    });

  /**
   * Converts one row of the workspace into the read model.
   * @param resource - Batch with its certificate.
   */
  toEntryFromResource = (resource: BatchEntryResource): BatchEntry => ({
    batch: this.toEntityFromResource(resource.batch),
    certificate: resource.certificate
      ? this.certificates.toEntityFromResource(resource.certificate)
      : null,
  });

  toRegisterRequestFromCommand = (
    command: RegisterHarvestBatchCommand,
  ): RegisterHarvestBatchRequest => ({
    batchCode: command.batchCode,
    cooperativeId: command.cooperativeId,
    memberId: command.memberId,
    plotId: command.plotId,
    cropType: command.cropType,
    harvestedOn: command.harvestedOn,
  });

  toWeighRequestFromCommand = (command: WeighDeliveredBatchCommand): WeighHarvestBatchRequest => ({
    grossWeightKg: command.grossWeightKg,
    tareKg: command.tareKg,
  });

  toSampleRequestFromCommand = (
    command: ExtractRepresentativeSampleCommand,
  ): ExtractRepresentativeSampleRequest => ({
    sampleIdentifier: command.sampleIdentifier,
    sampleWeightKg: command.sampleWeightKg,
  });

  toPotatoRequestFromCommand = (command: GradePotatoCalibersCommand): GradePotatoCalibersRequest => ({
    firstPercentage: command.firstPercentage,
    secondPercentage: command.secondPercentage,
    thirdPercentage: command.thirdPercentage,
    pestDamagePercentage: command.pestDamagePercentage,
  });

  toCoffeeRequestFromCommand = (command: PerformCoffeeCuppingCommand): CupCoffeeRequest => ({
    aroma: command.aroma,
    flavor: command.flavor,
    acidity: command.acidity,
    body: command.body,
    totalScore: command.totalScore,
    fermentDefect: command.fermentDefect,
  });
}
