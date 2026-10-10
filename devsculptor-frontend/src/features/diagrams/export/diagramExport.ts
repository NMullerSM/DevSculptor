import { DiagramSpec } from '../diagram.types';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Descarga el contenido SVG serializado del elemento SVG del DOM.
 */
export function downloadSvg(svgElement: SVGSVGElement, filename: string): void {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.style.backgroundColor = '#020617';

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  // Asegurar declaración XML
  if (!svgString.startsWith('<?xml')) {
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
  }

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Descarga una versión rasterizada PNG de alta resolución (2x DPI) del diagrama SVG.
 */
export function downloadPng(svgElement: SVGSVGElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.style.backgroundColor = '#020617';

    const width = parseFloat(clone.getAttribute('width') || '1200') || 1200;
    const height = parseFloat(clone.getAttribute('height') || '800') || 800;
    const scale = 2; // Retina 2x

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D de canvas'));
          return;
        }

        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(blobUrl);
          if (!blob) {
            reject(new Error('Fallo al generar Blob de PNG'));
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Error al cargar imagen SVG en canvas para exportar PNG'));
    };
    img.src = blobUrl;
  });
}

/**
 * Genera y descarga un archivo HTML 100% autónomo y autocontenido con el diagrama SVG embebido.
 * Cumple estrictamente con Content Security Policy (CERO scripts inline, solo CSS embebido).
 */
export function downloadStandaloneHtml(
  svgElement: SVGSVGElement,
  spec: DiagramSpec,
  filename: string
): void {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  // Resetear transformaciones de pan/zoom para el export estático
  clone.style.transform = 'none';
  clone.style.width = '100%';
  clone.style.height = 'auto';
  clone.style.maxHeight = '80vh';

  const serializer = new XMLSerializer();
  const svgHtml = serializer.serializeToString(clone);

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(spec.title)} - DevSculptor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #020617;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      width: 100%;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .badge {
      display: inline-block;
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .description {
      font-size: 12px;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .canvas-box {
      background: #0b1120;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px;
      overflow: auto;
      display: flex;
      justify-content: center;
    }
    .footer {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-family: monospace;
      color: #64748b;
    }
    @media print {
      body { background: #ffffff; color: #000000; padding: 0; }
      .container { border: none; box-shadow: none; background: transparent; padding: 0; }
      .canvas-box { background: transparent; border: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${escapeXml(spec.badge || spec.category.toUpperCase())}</div>
      <h1>${escapeXml(spec.title)}</h1>
      <div class="subtitle">${escapeXml(spec.subtitle)}</div>
      <p class="description">${escapeXml(spec.description)}</p>
    </div>
    <div class="canvas-box">
      ${svgHtml}
    </div>
    <div class="footer">
      <span>Generado por DevSculptor • Entregable de Arquitectura OKF</span>
      <span>${new Date().toLocaleDateString('es-ES')}</span>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ejecuta impresión directa compatible con PDF del navegador.
 */
export function printDiagramPdf(): void {
  window.print();
}
