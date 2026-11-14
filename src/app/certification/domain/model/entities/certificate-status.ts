/** Un certificado emitido puede estar vigente o revocado. */
export const CertificateStatus = { ACTIVE: 'ACTIVE', REVOKED: 'REVOKED' } as const;

/** Restringe el estado del certificado a los valores del dominio. */
export type CertificateStatus = (typeof CertificateStatus)[keyof typeof CertificateStatus];
