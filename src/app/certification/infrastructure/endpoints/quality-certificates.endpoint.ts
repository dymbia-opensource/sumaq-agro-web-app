import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { IssueQualityCertificateCommand } from '../../domain/model/commands/issue-quality-certificate.command';
import { QualityCertificate } from '../../domain/model/entities/quality-certificate.entity';
import { QualityCertificateAssembler } from '../assemblers/quality-certificate.assembler';
import { QualityCertificateResource } from '../responses/quality-certificate.response';
import { QualityCertificatesResponse } from '../responses/quality-certificates.response';

/** Acceso HTTP a los certificados de calidad. */
export class QualityCertificatesApiEndpoint extends BaseApiEndpoint<
  QualityCertificate,
  QualityCertificateResource,
  QualityCertificatesResponse,
  QualityCertificateAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderQualityCertificatesEndpointPath}`,
      new QualityCertificateAssembler(),
    );
  }

  /** Guarda un certificado asociado a un lote ya registrado. */
  issue(command: IssueQualityCertificateCommand): Observable<QualityCertificate> {
    return this.http
      .post<QualityCertificateResource>(this.endpointUrl, command)
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  /** Busca un certificado por el token público incluido en su QR. */
  getByToken(token: string): Observable<QualityCertificate | null> {
    const params = new HttpParams().set('verificationToken', token);
    return this.http
      .get<QualityCertificatesResponse | QualityCertificateResource[]>(this.endpointUrl, { params })
      .pipe(map((response) => this.toEntities(response)[0] ?? null));
  }
}
