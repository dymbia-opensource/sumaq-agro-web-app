import { FarmerProfile } from '../../domain/model/entities/farmer-profile.entity';
import { FarmerProfileResource } from '../responses/farmer-profile.response';

export class FarmerProfileAssembler {
  toEntityFromResource(resource: FarmerProfileResource): FarmerProfile {
    return new FarmerProfile({
      ...resource,
      phoneNumber: resource.phoneNumber ?? '',
      email: resource.email ?? '',
      dni: resource.dni ?? '',
    });
  }
}
