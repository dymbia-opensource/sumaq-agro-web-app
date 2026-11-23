import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IssueQualityCertificateCommand } from '../../domain/model/commands/issue-quality-certificate.command';
import { RevokeQualityCertificateCommand } from '../../domain/model/commands/revoke-quality-certificate.command';
import { QualityCertificate } from '../../domain/model/entities/quality-certificate.entity';
import { QualityCertificateAssembler } from '../assemblers/quality-certificate.assembler';
import { QualityCertificateResource } from '../responses/quality-certificate.response';

/** HTTP endpoint for the quality certificates (`/quality-certificates`). */
export class QualityCertificatesApiEndpoint {
  private readonly url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderQualityCertificatesEndpointPath}`;
  private readonly assembler = new QualityCertificateAssembler();

  constructor(private readonly http: HttpClient) {}

  issue(command: IssueQualityCertificateCommand): Observable<QualityCertificate> {
    return this.http
      .post<QualityCertificateResource>(this.url, this.assembler.toIssueRequestFromCommand(command))
      .pipe(map(this.assembler.toEntityFromResource));
  }

  getByNumber(certificateNumber: string): Observable<QualityCertificate> {
    return this.http
      .get<QualityCertificateResource>(this.url, { params: { certificateNumber } })
      .pipe(map(this.assembler.toEntityFromResource));
  }

  revoke(command: RevokeQualityCertificateCommand): Observable<QualityCertificate> {
    return this.http
      .post<QualityCertificateResource>(`${this.url}/${command.certificateId}/revocation`, null)
      .pipe(map(this.assembler.toEntityFromResource));
  }

  /**
   * Downloads the PDF of a certificate, with its QR code.
   * @param certificateId - Certificate to download.
   */
  document(certificateId: number): Observable<Blob> {
    return this.http.get(`${this.url}/${certificateId}/document`, { responseType: 'blob' });
  }
}
