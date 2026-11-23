/** Revokes a quality certificate; its QR code then shows it is no longer valid. */
export class RevokeQualityCertificateCommand {
  readonly certificateId: number;

  constructor(props: { certificateId: number }) {
    this.certificateId = props.certificateId;
  }
}
