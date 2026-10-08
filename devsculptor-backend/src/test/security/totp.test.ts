import { describe, it, expect } from 'vitest';
import {
  generateTotpCode,
  verifyTotpToken,
  generateTotpSecret,
  generateOtpauthUri,
  base32Decode,
  base32Encode,
} from '../../shared/utils/totp';

describe('Security: TOTP RFC 6238 Implementation & Vectors', () => {
  // RFC 6238 Test Secret: ASCII "12345678901234567890" (20 bytes)
  const rfcSecretAscii = '12345678901234567890';
  const rfcSecretBase32 = base32Encode(Buffer.from(rfcSecretAscii));

  it('debe codificar y decodificar Base32 de forma simétrica', () => {
    const raw = Buffer.from('TestPayloadForDevSculptor2026!');
    const encoded = base32Encode(raw);
    const decoded = base32Decode(encoded);
    expect(decoded.toString()).toBe('TestPayloadForDevSculptor2026!');
  });

  it('debe generar códigos deterministas que coincidan con los vectores oficiales de RFC 6238 (SHA1)', () => {
    // Vector 1: Time = 59s -> Counter = 1
    const code59 = generateTotpCode(rfcSecretBase32, 30, 59 * 1000);
    expect(code59).toBe('287082');

    // Vector 2: Time = 1111111109s
    const code1111111109 = generateTotpCode(rfcSecretBase32, 30, 1111111109 * 1000);
    expect(code1111111109).toBe('081804');

    // Vector 3: Time = 1111111111s
    const code1111111111 = generateTotpCode(rfcSecretBase32, 30, 1111111111 * 1000);
    expect(code1111111111).toBe('050471');

    // Vector 4: Time = 1234567890s
    const code1234567890 = generateTotpCode(rfcSecretBase32, 30, 1234567890 * 1000);
    expect(code1234567890).toBe('005924');

    // Vector 5: Time = 2000000000s
    const code2000000000 = generateTotpCode(rfcSecretBase32, 30, 2000000000 * 1000);
    expect(code2000000000).toBe('279037');
  });

  it('debe validar tokens dentro de la ventana de tolerancia de ±30 segundos', () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const currentCode = generateTotpCode(secret, 30, now);

    expect(verifyTotpToken(secret, currentCode)).toBe(true);
    expect(verifyTotpToken(secret, '999999')).toBe(false);
    expect(verifyTotpToken(secret, '')).toBe(false);
    expect(verifyTotpToken(secret, 'abc123')).toBe(false);
  });

  it('debe generar un URI otpauth válido para Google Authenticator', () => {
    const secret = generateTotpSecret();
    const uri = generateOtpauthUri('architect@devsculptor.io', secret);

    expect(uri).toContain('otpauth://totp/DevSculptor%3Aarchitect%40devsculptor.io');
    expect(uri).toContain(`secret=${secret}`);
    expect(uri).toContain('issuer=DevSculptor');
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
  });
});
