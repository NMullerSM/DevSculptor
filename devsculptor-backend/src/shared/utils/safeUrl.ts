import dns from 'dns';
import { ValidationError } from '../exceptions/ValidationError';
import { env } from '../../config/env';

function isPrivateIp(ip: string): boolean {
  // IPv6 checks
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }

  // IPv4 mapped into IPv6
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Si la IP es anómala, bloquearla
  }

  const [a, b] = parts;

  // 0.0.0.0/8
  if (a === 0) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 10.0.0.0/8 (RFC 1918)
  if (a === 10) return true;
  // 172.16.0.0/12 (RFC 1918)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (RFC 1918)
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  return false;
}

export async function assertSafeOutboundUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ValidationError('La URL del endpoint de IA no tiene un formato válido.');
  }

  if (parsed.username || parsed.password) {
    throw new ValidationError('La URL del endpoint no puede incluir credenciales en línea.');
  }

  const isDev = env.NODE_ENV === 'development';
  if (parsed.protocol !== 'https:' && (!isDev || parsed.protocol !== 'http:')) {
    throw new ValidationError('El endpoint de IA debe utilizar exclusivamente el protocolo seguro HTTPS.');
  }

  // Comprobar si el hostname es una IP directa privada
  if (isPrivateIp(parsed.hostname)) {
    throw new ValidationError('El endpoint especificado apunta a una dirección interna no permitida.');
  }

  // Resolver DNS para evitar evasiones por dominios que resuelven a localhost o IPs privadas
  try {
    const addresses = await dns.promises.lookup(parsed.hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new ValidationError('El dominio del endpoint resuelve a una red privada o protegida (SSRF).');
      }
    }
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError('No se pudo resolver el nombre de host del endpoint especificado.');
  }

  return parsed;
}
