/**
 * Device Trust Service — Zero-trust device identity verification.
 * Implements certificate-based device identity, trust scoring, and revocation.
 */

import crypto from 'node:crypto';

export interface DeviceTrustResult {
  trusted: boolean;
  score: number;        // 0.0 – 1.0
  reason: string;
  challengeRequired: boolean;
}

export interface DeviceFingerprint {
  platform: string;
  osVersion: string;
  appVersion: string;
  hardwareId: string;
  screenSize: string;
  locale: string;
}

export interface DeviceCertificate {
  publicKey: string;
  fingerprint: string;
  issuedAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

const TRUST_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.2,
} as const;

const MAX_CERTIFICATE_AGE_DAYS = 365;

export function generateDeviceChallenge(): { challenge: string; nonce: string } {
  const nonce = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.randomBytes(64).toString('base64url');
  return { challenge, nonce };
}

export function verifyDeviceChallenge(
  challenge: string,
  response: string,
  publicKey: string,
): boolean {
  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(challenge);
    return verifier.verify(publicKey, response, 'base64url');
  } catch {
    return false;
  }
}

export function computeTrustScore(
  cert: DeviceCertificate,
  fingerprint: DeviceFingerprint,
  previousFingerprints: DeviceFingerprint[],
): DeviceTrustResult {
  let score = 0;
  const reasons: string[] = [];

  if (cert.revoked) {
    return { trusted: false, score: 0, reason: 'certificate_revoked', challengeRequired: true };
  }

  if (cert.expiresAt < new Date()) {
    return { trusted: false, score: 0, reason: 'certificate_expired', challengeRequired: true };
  }

  // Certificate age factor (newer = higher trust)
  const certAgeDays = (Date.now() - cert.issuedAt.getTime()) / (1000 * 60 * 60 * 24);
  const ageFactor = Math.max(0, 1 - certAgeDays / MAX_CERTIFICATE_AGE_DAYS);
  score += ageFactor * 0.3;
  reasons.push(`cert_age:${ageFactor.toFixed(2)}`);

  // Fingerprint consistency
  if (previousFingerprints.length > 0) {
    const latest = previousFingerprints[previousFingerprints.length - 1];
    let matchCount = 0;
    if (latest.platform === fingerprint.platform) matchCount++;
    if (latest.osVersion === fingerprint.osVersion) matchCount++;
    if (latest.hardwareId === fingerprint.hardwareId) matchCount++;
    if (latest.locale === fingerprint.locale) matchCount++;
    const consistencyFactor = matchCount / 4;
    score += consistencyFactor * 0.4;
    reasons.push(`fingerprint_consistency:${consistencyFactor.toFixed(2)}`);
  } else {
    score += 0.1; // New device — low initial trust
    reasons.push('new_device');
  }

  // Valid certificate factor
  score += 0.3;
  reasons.push('valid_cert');

  const trusted = score >= TRUST_THRESHOLDS.MEDIUM;
  const challengeRequired = score < TRUST_THRESHOLDS.HIGH;

  return {
    trusted,
    score: Math.min(1, score),
    reason: reasons.join(';'),
    challengeRequired,
  };
}

export function generateDeviceKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

export function computeCertificateFingerprint(publicKey: string): string {
  return crypto.createHash('sha256').update(publicKey).digest('hex');
}

export function isDeviceCertificateValid(cert: DeviceCertificate): boolean {
  if (cert.revoked) return false;
  if (cert.expiresAt < new Date()) return false;
  const fingerprint = computeCertificateFingerprint(cert.publicKey);
  return fingerprint === cert.fingerprint;
}
