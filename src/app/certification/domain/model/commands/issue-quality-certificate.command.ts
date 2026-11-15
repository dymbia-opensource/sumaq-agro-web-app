import { QualityCertificateProps } from '../entities/quality-certificate.entity';

export type IssueQualityCertificateCommand = Omit<QualityCertificateProps, 'id'>;
