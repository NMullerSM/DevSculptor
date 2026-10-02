import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Codifica un Buffer en string Base32 RFC 4648 (sin padding).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodifica un string Base32 RFC 4648 a Buffer.
 */
export function base32Decode(base32Str: string): Buffer {
  const clean = base32Str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) {
      continue; // Ignorar caracteres inválidos
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Genera un secreto aleatorio Base32 para TOTP (160 bits = 20 bytes = 32 caracteres Base32).
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return base32Encode(randomBytes);
}

/**
 * Genera el URI otpauth:// para sincronizar con Google Authenticator, Microsoft Authenticator o Authy.
 */
export function generateOtpauthUri(email: string, secret: string, issuer: string = 'DevSculptor'): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Genera un código TOTP de 6 dígitos para un contador o tiempo específico (RFC 6238 / RFC 4226).
 */
export function generateTotpCode(secret: string, timeStepWindow: number = 30, forTimeMs: number = Date.now()): string {
  const counter = Math.floor(forTimeMs / 1000 / timeStepWindow);
  const secretBuffer = base32Decode(secret);

  // Buffer de 8 bytes big-endian para el contador
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic Truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return String(otp).padStart(6, '0');
}

/**
 * Valida un token TOTP de 6 dígitos con una ventana de tolerancia de ±1 paso (±30 segundos).
 */
export function verifyTotpToken(secret: string, token: string, toleranceSteps: number = 1): boolean {
  if (!token || token.trim().length !== 6) return false;
  const cleanToken = token.trim();
  const timeStep = 30 * 1000;
  const now = Date.now();

  for (let step = -toleranceSteps; step <= toleranceSteps; step++) {
    const calculated = generateTotpCode(secret, 30, now + step * timeStep);
    if (calculated === cleanToken) {
      return true;
    }
  }

  return false;
}
