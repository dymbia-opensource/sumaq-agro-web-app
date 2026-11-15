import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { TechnicalPrescription } from '../../domain/model/entities/technical-prescription.entity';
import {
  TechnicalPrescriptionResource,
  TechnicalPrescriptionsResponse,
} from '../responses/technical-prescription.response';

export class TechnicalPrescriptionAssembler implements BaseAssembler<
  TechnicalPrescription,
  TechnicalPrescriptionResource,
  TechnicalPrescriptionsResponse
> {
  toEntityFromResource(resource: TechnicalPrescriptionResource): TechnicalPrescription {
    return new TechnicalPrescription({
      id: resource.id,
      reportId: resource.reportId,
      agronomistId: resource.agronomistId,
      recommendedProducts: resource.recommendedProducts,
      dosageInstructions: resource.dosageInstructions,
      applicationDate: resource.applicationDate,
    });
  }
  toResourceFromEntity(entity: TechnicalPrescription): TechnicalPrescriptionResource {
    return {
      id: entity.id as number,
      reportId: entity.reportId,
      agronomistId: entity.agronomistId,
      recommendedProducts: entity.recommendedProducts,
      dosageInstructions: entity.dosageInstructions,
      applicationDate: entity.applicationDate,
    };
  }
  toEntitiesFromResponse(response: TechnicalPrescriptionsResponse): TechnicalPrescription[] {
    return response.prescriptions.map((r) => this.toEntityFromResource(r));
  }
}
