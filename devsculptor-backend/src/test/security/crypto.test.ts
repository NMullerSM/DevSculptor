import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from '../../shared/utils/crypto';

describe('Security: AES-256-GCM Encryption in Rest', () => {
  it('debe cifrar y descifrar secretos simétricamente', () => {
    const rawSecret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptSecret(rawSecret);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.split(':').length).toBe(3); // iv:tag:ciphertext

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('debe soportar secretos legados en texto plano sin corromperlos', () => {
    const legacySecret = 'MZXW6YTBOI======';
    const result = decryptSecret(legacySecret);
    expect(result).toBe(legacySecret);
  });

  it('debe manejar valores nulos o indefinidos con elegancia', () => {
    expect(decryptSecret(null)).toBeNull();
    expect(decryptSecret(undefined)).toBeNull();
    expect(encryptSecret('')).toBe('');
  });
});
