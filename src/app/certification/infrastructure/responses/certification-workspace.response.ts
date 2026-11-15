import { HarvestCropType } from "../../domain/model/entities/crop-type";

export interface RegisterBatchRequest {
  batchCode: string;
  cooperativeId: number;
  memberId: number;
  plotId: number;
  cropType: HarvestCropType;
  harvestedOn: string;
}

export interface HarvestBatchResource extends RegisterBatchRequest {
  id: number;
  status: "PENDING" | "GRADED" | "CERTIFIED";
  netWeightKg: number | null;
  sampleIdentifier: string | null;
  sampleWeightKg: number | null;
  qualityScore: number | null;
  qualityCategory: string | null;
}

export interface QualityCertificateResource {
  id: number;
  certificateNumber: string;
  harvestBatchId: number;
  qualityCategory: string;
  certificateHash: string;
  issuedAt: string;
  status: "ACTIVE" | "REVOKED";
}

export interface BatchEntry {
  batch: HarvestBatchResource;
  certificate: QualityCertificateResource | null;
}

export interface PublicTraceabilityResource {
  certificateNumber: string;
  status: string;
  authentic: boolean;
  batchCode: string | null;
  cropType: HarvestCropType | null;
  qualityCategory: string | null;
  qualityScore: number | null;
  plotName: string | null;
  region: string | null;
  seedVariety: string | null;
}
