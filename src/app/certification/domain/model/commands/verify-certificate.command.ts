/**
 * Verifies a certificate with the number and the SHA-256 hash of the link in
 * its QR code (`/verify?number=...&hash=...`).
 */
export class VerifyCertificateCommand {
  readonly number: string;
  readonly hash: string;

  constructor(props: { number: string | null; hash: string | null }) {
    const number = props.number?.trim() ?? '';
    const hash = props.hash?.trim() ?? '';
    if (!number || !hash) throw new Error('certification.workspace.missing-link');
    if (!/^[a-f0-9]{64}$/i.test(hash)) throw new Error('certification.workspace.invalid-hash');
    this.number = number;
    this.hash = hash;
  }
}
