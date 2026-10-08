import DOMPurify from 'dompurify';

/**
 * Sanitiza contenido HTML arbitrario previniendo ataques Cross-Site Scripting (XSS).
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true, svg: true },
  });
}

/**
 * Sanitiza contenido SVG vectorial preservando elementos y filtros SVG legítimos.
 */
export function sanitizeSvg(rawSvg: string): string {
  if (!rawSvg) return '';
  return DOMPurify.sanitize(rawSvg, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}
