/**
 * Certificate Manager — mTLS certificate lifecycle management.
 * Issues, rotates, and revokes device certificates for zero-trust PKI.
 */

import crypto from 'node:crypto';

export interface CertificateRequest {
  deviceId: string;
  publicKey: string;
  platform: string;
}

export interface IssuedCertificate {
  id: string;
  deviceId: string;
  publicKey: string;
  fingerprint: string;
  issuedAt: Date;
  expiresAt: Date;
  serialNumber: string;
}

export interface CertificateRevocation {
  certificateId: string;
  revokedAt: Date;
  reason: 'key_compromise' | 'device_lost' | 'user_revoked' | 'rotation' | 'expired';
}

const CERT_VALIDITY_DAYS = 365;
const RENEWAL_WINDOW_DAYS = 30;

export function issueCertificate(request: CertificateRequest): IssuedCertificate {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CERT_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  const fingerprint = crypto.createHash('sha256').update(request.publicKey).digest('hex');
  const serialNumber = crypto.randomBytes(16).toString('hex');

  return {
    id: crypto.randomUUID(),
    deviceId: request.deviceId,
    publicKey: request.publicKey,
    fingerprint,
    issuedAt: now,
    expiresAt,
    serialNumber,
  };
}

export function shouldRenewCertificate(cert: IssuedCertificate): boolean {
  const renewalThreshold = new Date(
    cert.expiresAt.getTime() - RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  return new Date() >= renewalThreshold;
}

export function rotateCertificate(
  oldCert: IssuedCertificate,
  newPublicKey: string,
): { newCert: IssuedCertificate; revocation: CertificateRevocation } {
  const newCert = issueCertificate({
    deviceId: oldCert.deviceId,
    publicKey: newPublicKey,
    platform: 'rotated',
  });

  const revocation: CertificateRevocation = {
    certificateId: oldCert.id,
    revokedAt: new Date(),
    reason: 'rotation',
  };

  return { newCert, revocation };
}

export function createRevocation(
  certificateId: string,
  reason: CertificateRevocation['reason'],
): CertificateRevocation {
  return {
    certificateId,
    revokedAt: new Date(),
    reason,
  };
}

export function validateCertificateChain(
  devicePublicKey: string,
  expectedFingerprint: string,
): boolean {
  const actualFingerprint = crypto.createHash('sha256').update(devicePublicKey).digest('hex');
  return actualFingerprint === expectedFingerprint;
}

export function generatePairingCode(): string {
  // 6-digit numeric code for QR pairing verification
  return crypto.randomInt(100000, 999999).toString();
}

export function generateQRPayload(
  serverUrl: string,
  deviceId: string,
  pairingCode: string,
  publicKey: string,
): string {
  const payload = {
    version: 1,
    server: serverUrl,
    deviceId,
    code: pairingCode,
    pk: publicKey,
    ts: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function parseQRPayload(encoded: string): {
  version: number;
  server: string;
  deviceId: string;
  code: string;
  pk: string;
  ts: number;
} | null {
  try {
    const decoded = Buffer.from(encoded, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
