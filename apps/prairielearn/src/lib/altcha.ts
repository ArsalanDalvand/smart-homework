import crypto from 'node:crypto';

import { config } from './config.js';

/**
 * Self-hosted, dependency-free Altcha-style SHA-256 proof-of-work challenge.
 *
 * challenge = sha256(salt + secretNumber), 0 <= secretNumber <= maxnumber.
 * signature = HMAC-SHA256(secretKey, `${salt}.${challenge}.${maxnumber}.${expires}`).
 */
const MAX_NUMBER = 35000;
const TTL_MS = 5 * 60 * 1000;
const MAX_PAYLOAD_LENGTH = 2048;

export interface AltchaChallenge {
  algorithm: 'SHA-256';
  salt: string;
  challenge: string;
  maxnumber: number;
  expires: number;
  signature: string;
}

// Single-use replay guard (signature -> expiry). Process-local; challenges
// are short-lived so the map stays small.
const usedChallenges = new Map<string, number>();
const MAX_USED_ENTRIES = 50_000;

function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function sign(key: string, salt: string, challenge: string, maxnumber: number, expires: number) {
  return crypto
    .createHmac('sha256', key)
    .update(`${salt}.${challenge}.${maxnumber}.${expires}`)
    .digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function pruneUsed(now: number) {
  for (const [sig, exp] of usedChallenges) {
    if (exp < now) usedChallenges.delete(sig);
  }
}

export function createAltchaChallenge(): AltchaChallenge {
  const now = Date.now();
  const expires = now + TTL_MS;
  const salt = `${crypto.randomBytes(12).toString('hex')}?expires=${expires}&`;
  const secretNumber = crypto.randomInt(0, MAX_NUMBER + 1);
  const challenge = sha256Hex(salt + secretNumber);
  const signature = sign(config.secretKey[0], salt, challenge, MAX_NUMBER, expires);
  return { algorithm: 'SHA-256', salt, challenge, maxnumber: MAX_NUMBER, expires, signature };
}

export type AltchaResult = { ok: true } | { ok: false; reason: string };

export function verifyAltchaPayload(payloadBase64: unknown): AltchaResult {
  if (typeof payloadBase64 !== 'string' || !payloadBase64 || payloadBase64.length > MAX_PAYLOAD_LENGTH) {
    return { ok: false, reason: 'missing' };
  }
  let p: any;
  try {
    p = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (
    !p ||
    typeof p.salt !== 'string' ||
    typeof p.challenge !== 'string' ||
    typeof p.signature !== 'string' ||
    !Number.isInteger(p.maxnumber) ||
    !Number.isInteger(p.expires) ||
    !Number.isInteger(p.number) ||
    p.number < 0
  ) {
    return { ok: false, reason: 'malformed' };
  }

  const now = Date.now();
  if (p.expires < now) return { ok: false, reason: 'expired' };
  if (p.maxnumber !== MAX_NUMBER || p.number > p.maxnumber) return { ok: false, reason: 'invalid' };

  const signatureOk = config.secretKey.some((key) =>
    safeEqualHex(sign(key, p.salt, p.challenge, p.maxnumber, p.expires), p.signature),
  );
  if (!signatureOk) return { ok: false, reason: 'invalid' };

  if (!safeEqualHex(sha256Hex(p.salt + p.number), p.challenge)) {
    return { ok: false, reason: 'invalid' };
  }

  // Replay guard: a solved challenge can be consumed only once.
  pruneUsed(now);
  if (usedChallenges.has(p.signature)) return { ok: false, reason: 'replayed' };
  if (usedChallenges.size >= MAX_USED_ENTRIES) return { ok: false, reason: 'busy' };
  usedChallenges.set(p.signature, p.expires);
  return { ok: true };
}
