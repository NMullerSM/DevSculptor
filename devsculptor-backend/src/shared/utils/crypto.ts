import crypto from 'crypto';
import { env } from '../../config/env';

/**
 * Deriva una clave AES-256 (32 bytes) segura a partir de la variable MFA_ENCRYPTION_KEY.
 */
function getDerivedKey(): Buffer {
  return crypto.createHash('sha256').update(env.MFA_ENCRYPTION_KEY).digest();
}

/**
 * Cifra un secreto en reposo utilizando AES-256-GCM autenticado.
 * Formato devuelto: iv_base64:tag_base64:ciphertext_base64
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12); // 96 bits recomendados por NIST para GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Descifra un secreto cifrado con AES-256-GCM.
 * Si el secreto es heredado (texto plano anterior a la migración), lo devuelve directamente
 * permitiendo una migración fluida e indolora.
 */
export function decryptSecret(encryptedPayload: string | null | undefined): string | null {
  if (!encryptedPayload) return null;

  // Si no contiene el delimitador de 3 segmentos, es un secreto en texto plano legado
  if (!encryptedPayload.includes(':')) {
    return encryptedPayload;
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    return encryptedPayload;
  }

  try {
    const key = getDerivedKey();
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    // Si falla la verificación de autenticación de tag GCM
    return encryptedPayload;
  }
}
