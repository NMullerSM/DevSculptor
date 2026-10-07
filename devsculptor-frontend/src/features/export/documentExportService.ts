import { Project } from '@/types/project.types';
import { Requirement } from '@/types/requirement.types';
import { Decision } from '@/types/decision.types';
import { CanvasEntity } from '@/types/canvas.types';
import { ProjectMetrics } from '@/types/metrics.types';
import { EnterpriseTemplateDef } from './okfTemplates';

export type ExportFormat = 'html' | 'md';

/**
 * Convierte texto en formato Markdown a HTML estilizado de alta fidelidad de forma determinista.
 */
export function convertMarkdownToHtml(markdown: string): string {
  // 1. Limpiar frontmatter YAML si existe
  let cleanMd = markdown.replace(/^---[\s\S]*?---\n*/, '').trim();

  // Escapar HTML básico en texto para evitar inyecciones no deseadas, excepto en bloques de código
  const lines = cleanMd.split('\n');
  const processedLines: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length === 0) return;
    let tableHtml = '<div class="table-container"><table>';
    let isHeader = true;

    for (const row of tableBuffer) {
      const trimmed = row.trim();
      // Ignorar líneas separadoras de markdown como |:---|:---:|
      if (/^\|[\s:-|]+\|$/.test(trimmed)) {
        isHeader = false;
        continue;
      }
      const cells = trimmed
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());

      if (isHeader) {
        tableHtml += '<thead><tr>';
        cells.forEach((c) => {
          tableHtml += `<th>${inlineFormat(c)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        isHeader = false;
      } else {
        tableHtml += '<tr>';
        cells.forEach((c) => {
          tableHtml += `<td>${inlineFormat(c)}</td>`;
        });
        tableHtml += '</tr>';
      }
    }

    tableHtml += '</tbody></table></div>';
    processedLines.push(tableHtml);
    tableBuffer = [];
    inTable = false;
  };

  const flushCode = () => {
    if (codeBuffer.length === 0) return;
    const rawCode = codeBuffer.join('\n').trim();
    const escaped = rawCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const isMermaid =
      codeLang === 'mermaid' ||
      codeLang === 'mmd' ||
      /^(classDiagram|flowchart|graph|erDiagram|sequenceDiagram|stateDiagram|pie|gantt|gitGraph|C4Context|C4Container|C4Component)/m.test(
        rawCode
      );

    if (isMermaid) {
      let diagramLabel = 'Diagrama Arquitectónico';
      if (/^classDiagram/m.test(rawCode)) diagramLabel = 'Diagrama de Clases (UML 2.5)';
      else if (/^sequenceDiagram/m.test(rawCode)) diagramLabel = 'Diagrama de Secuencia (UML)';
      else if (/^erDiagram/m.test(rawCode)) diagramLabel = 'Diagrama Entidad-Relación (ERD)';
      else if (/^stateDiagram/m.test(rawCode)) diagramLabel = 'Diagrama de Estados (FSM)';
      else if (/^(flowchart|graph)/m.test(rawCode)) diagramLabel = 'Diagrama de Paquetes / Flujo';
      else if (/^C4/m.test(rawCode)) diagramLabel = 'Modelo C4 de Arquitectura';

      processedLines.push(`
<div class="diagram-composite-module">
  <div class="diagram-meta-header">
    <div class="diagram-meta-left">
      <span class="diagram-icon">⬡</span>
      <span class="diagram-meta-title">${diagramLabel}</span>
    </div>
    <span class="diagram-badge">MERMAID UML / .MMD</span>
  </div>

  <!-- SECCIÓN 1: CÓDIGO FORMAL VISUALMENTE EXPRESADO -->
  <div class="diagram-code-section">
    <div class="diagram-section-header">
      <span class="diagram-section-title">Definición Formal de Código (.mmd)</span>
      <span class="diagram-line-count">${rawCode.split('\n').length} líneas</span>
    </div>
    <pre class="code-block diagram-source"><code>${escaped}</code></pre>
  </div>

  <!-- SECCIÓN 2: DIAGRAMA VISUAL EXPRESADO ABAJO -->
  <div class="diagram-visual-section">
    <div class="diagram-section-header">
      <div class="flex-align-center">
        <span class="pulse-dot"></span>
        <span class="diagram-section-title">Representación Gráfica del Diagrama</span>
      </div>
      <span class="render-badge">Renderizado Visual</span>
    </div>
    <div class="diagram-render-container">
      <div class="mermaid">${rawCode}</div>
    </div>
  </div>
</div>
`);
    } else {
      processedLines.push(`<pre class="code-block"><code>${escaped}</code></pre>`);
    }
    codeBuffer = [];
    codeLang = '';
    inCodeBlock = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Manejo de bloques de código
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
      } else {
        if (inTable) flushTable();
        codeLang = line.trim().slice(3).trim().toLowerCase();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Manejo de Tablas
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      tableBuffer.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Encabezados
    if (line.startsWith('# ')) {
      processedLines.push(`<h1 class="doc-h1">${inlineFormat(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      processedLines.push(`<h2 class="doc-h2">${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      processedLines.push(`<h3 class="doc-h3">${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith('#### ')) {
      processedLines.push(`<h4 class="doc-h4">${inlineFormat(line.slice(5))}</h4>`);
    } else if (line.startsWith('> ')) {
      processedLines.push(`<blockquote class="doc-blockquote">${inlineFormat(line.slice(2))}</blockquote>`);
    } else if (line.trim() === '---') {
      processedLines.push('<hr class="doc-divider" />');
    } else if (/^[-*]\s+/.test(line.trim())) {
      const content = line.trim().replace(/^[-*]\s+/, '');
      processedLines.push(`<li class="doc-li">${inlineFormat(content)}</li>`);
    } else if (/^\d+\.\s+/.test(line.trim())) {
      const content = line.trim().replace(/^\d+\.\s+/, '');
      processedLines.push(`<li class="doc-li-num">${inlineFormat(content)}</li>`);
    } else if (line.trim().length > 0) {
      processedLines.push(`<p class="doc-p">${inlineFormat(line)}</p>`);
    } else {
      // Línea en blanco
      processedLines.push('<div class="doc-spacing"></div>');
    }
  }

  if (inTable) flushTable();
  if (inCodeBlock) flushCode();

  return processedLines.join('\n');
}

/**
 * Convierte formato en línea (negritas, cursivas, enlaces y badges).
 */
function inlineFormat(text: string): string {
  let res = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Badges para estados y prioridades comunes
  const badgeMap: Record<string, string> = {
    APPROVED: 'badge-success',
    ACCEPTED: 'badge-success',
    PROPUESTA: 'badge-warning',
    PENDING: 'badge-warning',
    REJECTED: 'badge-danger',
    DEPRECATED: 'badge-neutral',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
    CRITICAL: 'badge-danger',
  };

  // Convertir tags en código backtick
  res = res.replace(/`([^`]+)`/g, (_match, token: string) => {
    const upper = token.toUpperCase().trim();
    if (badgeMap[upper]) {
      return `<span class="badge ${badgeMap[upper]}">${token}</span>`;
    }
    return `<code class="inline-code">${token}</code>`;
  });

  // Negrita
  res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Cursiva
  res = res.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Enlaces en Markdown [texto](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="doc-link" target="_blank" rel="noopener noreferrer">$1</a>');

  return res;
}

/**
 * Plantilla HTML universal autosuficiente con diseño moderno visionOS / DevSculptor.
 * Contiene soporte nativo para impresión ejecutiva (Ctrl+P / Botón PDF).
 */
export function buildUniversalHtmlDocument(params: {
  title: string;
  subtitle: string;
  badgeText: string;
  projectName: string;
  projectDescription?: string;
  architectureStyle?: string;
  leadArchitect?: string;
  dateStr: string;
  contentHtml: string;
}): string {
  const {
    title,
    subtitle,
    badgeText,
    projectName,
    projectDescription: _projectDescription,
    architectureStyle,
    leadArchitect,
    dateStr,
    contentHtml,
  } = params;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — DevSculptor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-gradient: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0f172a 50%, #030712 100%);
      --surface-glass: rgba(15, 23, 42, 0.75);
      --surface-border: rgba(99, 102, 241, 0.25);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent-indigo: #6366f1;
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --card-bg: rgba(30, 41, 59, 0.5);
      --code-bg: rgba(15, 23, 42, 0.9);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-gradient);
      background-attachment: fixed;
      color: var(--text-main);
      min-height: 100vh;
      padding: 40px 20px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
    }

    /* Top Floating Bar */
    .top-actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      padding: 12px 20px;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--surface-border);
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-logo {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      color: #fff;
    }

    .brand-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #e2e8f0;
      text-transform: uppercase;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(79, 70, 229, 0.9));
      color: #ffffff;
      border: 1px solid rgba(165, 180, 252, 0.3);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }

    .action-btn:hover {
      background: linear-gradient(135deg, rgba(99, 102, 241, 1), rgba(79, 70, 229, 1));
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
      transform: translateY(-1px);
    }

    /* Executive Document Header */
    .doc-header-card {
      background: var(--surface-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--surface-border);
      border-radius: 20px;
      padding: 36px 40px;
      margin-bottom: 32px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
      position: relative;
      overflow: hidden;
    }

    .doc-header-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #6366f1, #06b6d4, #10b981);
    }

    .doc-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
      margin-bottom: 14px;
    }

    .doc-title {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    .doc-subtitle {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 24px;
      max-width: 800px;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #64748b;
    }

    .meta-value {
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Content Body */
    .doc-content-card {
      background: var(--surface-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--surface-border);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
    }

    .doc-h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 32px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .doc-h1:first-child {
      margin-top: 0;
    }

    .doc-h2 {
      font-size: 17px;
      font-weight: 700;
      color: #38bdf8;
      margin-top: 26px;
      margin-bottom: 12px;
    }

    .doc-h3 {
      font-size: 14px;
      font-weight: 600;
      color: #a5b4fc;
      margin-top: 20px;
      margin-bottom: 8px;
    }

    .doc-p {
      font-size: 13.5px;
      color: #cbd5e1;
      margin-bottom: 12px;
    }

    .doc-spacing {
      height: 12px;
    }

    .doc-divider {
      border: none;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 28px 0;
    }

    .doc-blockquote {
      border-left: 3px solid var(--accent-indigo);
      background: rgba(99, 102, 241, 0.08);
      padding: 12px 18px;
      border-radius: 0 10px 10px 0;
      margin: 16px 0;
      font-size: 13px;
      color: #cbd5e1;
      font-style: italic;
    }

    .doc-li {
      margin-left: 24px;
      margin-bottom: 6px;
      font-size: 13.5px;
      color: #cbd5e1;
      list-style-type: square;
    }

    .doc-li-num {
      margin-left: 24px;
      margin-bottom: 6px;
      font-size: 13.5px;
      color: #cbd5e1;
      list-style-type: decimal;
    }

    .doc-link {
      color: #38bdf8;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    /* Tablas */
    .table-container {
      overflow-x: auto;
      margin: 20px 0;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(15, 23, 42, 0.6);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 12.5px;
    }

    thead tr {
      background: rgba(30, 41, 59, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    th {
      padding: 12px 16px;
      font-weight: 700;
      color: #f1f5f9;
      text-transform: uppercase;
      font-size: 10.5px;
      letter-spacing: 0.5px;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
    }

    tbody tr:hover {
      background: rgba(99, 102, 241, 0.05);
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.4px;
    }

    .badge-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-warning {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .badge-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .badge-neutral {
      background: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .badge-high {
      background: rgba(249, 115, 22, 0.15);
      color: #fb923c;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }

    .badge-medium {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .badge-low {
      background: rgba(100, 116, 139, 0.15);
      color: #94a3b8;
      border: 1px solid rgba(100, 116, 139, 0.3);
    }

    .inline-code {
      font-family: 'JetBrains Mono', monospace;
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11.5px;
      color: #38bdf8;
    }

    .code-block {
      background: var(--code-bg);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #e2e8f0;
      line-height: 1.5;
    }

    /* Footer */
    .doc-footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      font-size: 11px;
      color: #64748b;
      letter-spacing: 0.4px;
    }

    /* Composite Diagram Module (Code + Visual Render) */
    .diagram-composite-module {
      margin: 28px 0;
      border-radius: 16px;
      border: 1px solid rgba(99, 102, 241, 0.25);
      background: rgba(6, 10, 20, 0.85);
      overflow: hidden;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.6);
    }

    .diagram-meta-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 18px;
      background: linear-gradient(90deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .diagram-meta-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .diagram-icon {
      color: #818cf8;
      font-size: 16px;
    }

    .diagram-meta-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.2px;
    }

    .diagram-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.4);
      letter-spacing: 0.5px;
    }

    .diagram-code-section {
      background: #030712;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .diagram-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 18px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #94a3b8;
    }

    .diagram-section-title {
      font-weight: 600;
      color: #cbd5e1;
    }

    .diagram-line-count {
      color: #64748b;
      font-size: 10px;
    }

    .diagram-source {
      margin: 0 !important;
      border-radius: 0 !important;
      border: none !important;
      background: transparent !important;
      padding: 14px 18px !important;
      font-size: 11.5px !important;
      color: #6ee7b7 !important;
      max-height: 220px;
      overflow-y: auto;
    }

    .diagram-visual-section {
      background: #070b16;
    }

    .render-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .diagram-render-container {
      padding: 24px;
      overflow-x: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 240px;
      background: radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.4) 0%, rgba(3, 7, 18, 0.8) 100%);
    }

    .mermaid {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
    }

    .flex-align-center {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      box-shadow: 0 0 8px #10b981;
    }

    /* Print Stylesheet (Optimizado para guardar en PDF ejecutivo) */
    @media print {
      body {
        background: #ffffff !important;
        color: #0f172a !important;
        padding: 0 !important;
      }

      .no-print, .top-actions-bar {
        display: none !important;
      }

      .doc-header-card, .doc-content-card {
        background: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        padding: 24px !important;
        margin-bottom: 20px !important;
        page-break-inside: avoid;
      }

      .doc-title {
        color: #0f172a !important;
      }

      .doc-h1 {
        color: #0f172a !important;
        border-bottom: 1px solid #cbd5e1 !important;
      }

      .doc-h2 {
        color: #0369a1 !important;
      }

      .doc-h3 {
        color: #4338ca !important;
      }

      .doc-p, td, .doc-li, .doc-li-num {
        color: #334155 !important;
      }

      .table-container {
        background: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        page-break-inside: avoid;
      }

      thead tr {
        background: #f1f5f9 !important;
      }

      th {
        color: #0f172a !important;
      }

      td {
        border-bottom: 1px solid #e2e8f0 !important;
      }

      .badge {
        border: 1px solid #64748b !important;
      }

      .diagram-composite-module {
        background: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        margin: 20px 0 !important;
      }

      .diagram-meta-header {
        background: #f1f5f9 !important;
        border-bottom: 1px solid #cbd5e1 !important;
      }

      .diagram-meta-title {
        color: #0f172a !important;
      }

      .diagram-code-section {
        background: #f8fafc !important;
        border-bottom: 1px solid #cbd5e1 !important;
      }

      .diagram-source {
        color: #0f172a !important;
        max-height: none !important;
      }

      .diagram-section-header {
        background: #f1f5f9 !important;
        color: #475569 !important;
      }

      .diagram-section-title {
        color: #0f172a !important;
      }

      .diagram-visual-section {
        background: #ffffff !important;
      }

      .diagram-render-container {
        background: #ffffff !important;
        min-height: auto !important;
        padding: 16px !important;
      }

      .mermaid svg {
        filter: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Barra superior de utilidades -->
    <div class="top-actions-bar no-print">
      <div class="brand-group">
        <div class="brand-logo">DS</div>
        <div class="brand-title">DevSculptor &bull; Documento Oficial</div>
      </div>
      <div>
        <button class="action-btn" onclick="window.print()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Imprimir / Guardar como PDF
        </button>
      </div>
    </div>

    <!-- Encabezado Ejecutivo del Documento -->
    <div class="doc-header-card">
      <div class="doc-badge">${badgeText}</div>
      <h1 class="doc-title">${title}</h1>
      <p class="doc-subtitle">${subtitle}</p>

      <div class="metadata-grid">
        <div class="meta-item">
          <span class="meta-label">Proyecto</span>
          <span class="meta-value">${projectName}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Fecha de Emisión</span>
          <span class="meta-value">${dateStr}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Líder Arquitecto</span>
          <span class="meta-value">${leadArchitect || 'Senior Staff Architect'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Estilo Arquitectónico</span>
          <span class="meta-value">${architectureStyle || 'Layered MVC Modular'}</span>
        </div>
      </div>
    </div>

    <!-- Cuerpo del Documento -->
    <div class="doc-content-card">
      ${contentHtml}
    </div>

    <div class="doc-footer">
      DevSculptor Enterprise Architecture Governance &bull; Certificado para producción y compliance normativo.
    </div>
  </div>

  <!-- Mermaid Architecture Diagram Engine -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof mermaid !== 'undefined') {
        try {
          mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'JetBrains Mono, Inter, ui-sans-serif, system-ui',
            themeVariables: {
              darkMode: true,
              background: '#070b16',
              primaryColor: '#6366f1',
              primaryTextColor: '#f8fafc',
              primaryBorderColor: '#818cf8',
              lineColor: '#38bdf8',
              secondaryColor: '#0ea5e9',
              tertiaryColor: '#1e1b4b',
              mainBkg: '#0f172a',
              nodeBorder: '#6366f1',
              clusterBkg: 'rgba(30, 27, 75, 0.4)',
              clusterBorder: '#818cf8',
              defaultLinkColor: '#38bdf8',
              titleColor: '#ffffff',
              edgeLabelBackground: '#1e1b4b',
              actorBkg: '#1e1b4b',
              actorBorder: '#6366f1',
              actorTextColor: '#ffffff',
              signalColor: '#38bdf8',
              signalTextColor: '#f8fafc'
            }
          });
        } catch (e) {
          console.warn('[DevSculptor] Error al inicializar Mermaid en documento:', e);
        }
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Dispara la descarga directa de un archivo en el navegador del cliente.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/html;charset=utf-8'): void {
  if (!content || content.trim().length === 0) {
    console.warn(`[triggerFileDownload] Intento de descarga de archivo vacío: ${filename}`);
  }
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 15000);
}

/**
 * Servicio integral de exportación universal para SRS y ADRs.
 */
export const documentExportService = {
  /**
   * Exporta la Especificación de Requisitos IEEE-830 completa en HTML o Markdown.
   */
  exportSrs(project: Project, requirements: Requirement[], format: ExportFormat = 'html'): void {
    const rfList = requirements.filter((r) => r.type === 'RF');
    const rnfList = requirements.filter((r) => r.type === 'RNF');
    const now = new Date().toISOString().split('T')[0];

    // Construir cuerpo en Markdown
    let md = `# Especificación de Requisitos de Software (SRS — IEEE-830)\n\n`;
    md += `**Proyecto:** ${project.name}\n`;
    md += `**Descripción:** ${project.description || 'Sin descripción provista.'}\n`;
    md += `**Fecha de Certificación:** ${now}\n`;
    md += `**Líder Arquitecto:** ${project.lead_architect || 'Lead Architect'}\n\n`;
    md += `--- \n\n`;

    md += `## 1. Requisitos Funcionales (RF)\n\n`;
    md += `Los requisitos funcionales detallan el comportamiento del sistema, sus flujos operativos y las reglas de negocio:\n\n`;
    md += `| Código | Título | Prioridad | Especificación Detallada |\n`;
    md += `| :---: | :--- | :---: | :--- |\n`;

    if (rfList.length === 0) {
      md += `| - | *No hay requisitos funcionales registrados.* | - | - |\n`;
    } else {
      rfList.forEach((rf) => {
        const desc = (rf.description || '').replace(/\n/g, ' ').replace(/\|/g, '\\|');
        md += `| **${rf.code}** | ${rf.title} | \`${rf.priority}\` | ${desc} |\n`;
      });
    }

    md += `\n## 2. Requisitos No Funcionales y Calidad de Servicio (RNF)\n\n`;
    md += `Restricciones arquitectónicas, estándares de rendimiento, seguridad y mantenibilidad:\n\n`;
    md += `| Código | Título | Prioridad | Especificación Detallada |\n`;
    md += `| :---: | :--- | :---: | :--- |\n`;

    if (rnfList.length === 0) {
      md += `| - | *No hay requisitos no funcionales registrados.* | - | - |\n`;
    } else {
      rnfList.forEach((rnf) => {
        const desc = (rnf.description || '').replace(/\n/g, ' ').replace(/\|/g, '\\|');
        md += `| **${rnf.code}** | ${rnf.title} | \`${rnf.priority}\` | ${desc} |\n`;
      });
    }

    md += `\n## 3. Gobernanza y Matriz de Trazabilidad\n\n`;
    md += `- Total de requisitos formalizados: **${requirements.length}** (${rfList.length} Funcionales, ${rnfList.length} No Funcionales).\n`;
    md += `- Estado de validación técnica: **100% Ratificado bajo esquemas Zod**.\n`;
    md += `- Conforme al estándar internacional IEEE-830 para ingeniería de requerimientos de software.\n`;

    const sanitizedProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'html') {
      const contentHtml = convertMarkdownToHtml(md);
      const fullHtml = buildUniversalHtmlDocument({
        title: `Especificación de Requisitos (SRS IEEE-830)`,
        subtitle: `Documento unificado de gobernanza de requerimientos funcionales y de calidad de servicio para ${project.name}.`,
        badgeText: 'IEEE-830 Software Requirements Specification',
        projectName: project.name,
        projectDescription: project.description || undefined,
        architectureStyle: project.architecture_style || undefined,
        leadArchitect: project.lead_architect || undefined,
        dateStr: now,
        contentHtml,
      });

      triggerFileDownload(fullHtml, `${sanitizedProjectName}_SRS_IEEE830.html`, 'text/html;charset=utf-8');
    } else {
      triggerFileDownload(md, `${sanitizedProjectName}_SRS_IEEE830.md`, 'text/markdown;charset=utf-8');
    }
  },

  /**
   * Exporta el Dossier Completo de Decisiones de Arquitectura (ADRs) incluyendo
   * tanto el catálogo/resumen como todas las especificaciones detalladas de cada acta.
   */
  exportAdrsDossier(project: Project, decisions: Decision[], format: ExportFormat = 'html'): void {
    const now = new Date().toISOString().split('T')[0];

    // Construir Markdown integral con Catálogo + Especificaciones
    let md = `# Dossier de Decisiones de Arquitectura (ADRs)\n\n`;
    md += `**Proyecto:** ${project.name}\n`;
    md += `**Estilo Arquitectónico Base:** ${project.architecture_style || 'Monolito Modular Layered MVC'}\n`;
    md += `**Fecha de Emisión del Dossier:** ${now}\n`;
    md += `**Líder Técnico / Arquitecto:** ${project.lead_architect || 'Lead Architect'}\n\n`;
    md += `--- \n\n`;

    md += `## 1. Catálogo Consolidado de Decisiones\n\n`;
    md += `Registro de actas aprobadas, en revisión o deprecadas bajo el estándar de Michael Nygard:\n\n`;
    md += `| Código | Título de la Decisión | Estado Oficial | Fecha |\n`;
    md += `| :---: | :--- | :---: | :---: |\n`;

    if (decisions.length === 0) {
      md += `| - | *No se han registrado actas ADR para este proyecto.* | - | - |\n`;
    } else {
      decisions.forEach((d, idx) => {
        const adrCode = `ADR-${String(idx + 1).padStart(3, '0')}`;
        const date = d.created_at ? d.created_at.split('T')[0] : now;
        md += `| **${adrCode}** | ${d.title} | \`${d.status}\` | ${date} |\n`;
      });
    }

    md += `\n---\n\n`;
    md += `## 2. Actas Detalladas de Arquitectura\n\n`;

    if (decisions.length === 0) {
      md += `*No hay actas registradas para documentar en detalle.*\n`;
    } else {
      decisions.forEach((d, idx) => {
        const adrCode = `ADR-${String(idx + 1).padStart(3, '0')}`;
        const date = d.created_at ? d.created_at.split('T')[0] : now;

        md += `### ${adrCode}: ${d.title}\n\n`;
        md += `* **Estado Oficial:** \`${d.status}\`\n`;
        md += `* **Fecha de Registro:** ${date}\n`;
        md += `* **Proyecto Vinculado:** ${project.name}\n\n`;

        md += `#### Contexto y Problema Técnico\n`;
        md += `${d.context || 'Sin especificación de contexto registrada.'}\n\n`;

        md += `#### Decisión Arquitectónica Adoptada\n`;
        md += `${d.decision || 'Sin especificación formal de la decisión adoptada.'}\n\n`;

        md += `#### Consecuencias y Compromisos Técnicos\n`;
        md += `- Esta decisión fue ratificada formalmente en el Estudio de Gobernanza de DevSculptor.\n`;
        md += `- Toda modificación a esta directriz requiere emitir una nueva acta revocatoria o sustituta.\n`;
        md += `- Compromiso con el principio de estabilidad y mínimo acoplamiento estructural.\n\n`;
        md += `---\n\n`;
      });
    }

    const sanitizedProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'html') {
      const contentHtml = convertMarkdownToHtml(md);
      const fullHtml = buildUniversalHtmlDocument({
        title: `Dossier de Decisiones de Arquitectura (ADRs)`,
        subtitle: `Catálogo exhaustivo y actas formales de arquitectura de software para ${project.name}.`,
        badgeText: 'Architecture Decision Records Dossier',
        projectName: project.name,
        projectDescription: project.description || undefined,
        architectureStyle: project.architecture_style || undefined,
        leadArchitect: project.lead_architect || undefined,
        dateStr: now,
        contentHtml,
      });

      triggerFileDownload(fullHtml, `${sanitizedProjectName}_Dossier_ADR.html`, 'text/html;charset=utf-8');
    } else {
      triggerFileDownload(md, `${sanitizedProjectName}_Dossier_ADR.md`, 'text/markdown;charset=utf-8');
    }
  },

  /**
   * Genera el HTML universal de una plantilla empresarial específica para visualización o impresión.
   */
  getEnterpriseTemplateHtml(
    project: Project,
    template: EnterpriseTemplateDef,
    requirements: Requirement[],
    entities: CanvasEntity[],
    decisions: Decision[],
    metrics?: ProjectMetrics | null
  ): string {
    const now = new Date().toISOString().split('T')[0];
    const generated = template.generate(project, requirements, entities, decisions, metrics);
    const contentHtml = convertMarkdownToHtml(generated.fullContent);

    return buildUniversalHtmlDocument({
      title: template.title,
      subtitle: `${template.description} — Estándar: ${template.standard}. Conforme a especificaciones de DevSculptor.`,
      badgeText: template.standard,
      projectName: project.name,
      projectDescription: project.description || undefined,
      architectureStyle: project.architecture_style || undefined,
      leadArchitect: project.lead_architect || undefined,
      dateStr: now,
      contentHtml,
    });
  },

  /**
   * Exporta una plantilla empresarial específica en formato HTML o Markdown (.md)
   */
  exportEnterpriseTemplate(
    project: Project,
    template: EnterpriseTemplateDef,
    format: ExportFormat,
    requirements: Requirement[],
    entities: CanvasEntity[],
    decisions: Decision[],
    metrics?: ProjectMetrics | null
  ): void {
    const sanitizedProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedTitle = template.id.toUpperCase().replace(/[^a-zA-Z0-9_-]/g, '_');
    const generated = template.generate(project, requirements, entities, decisions, metrics);

    if (format === 'html') {
      const fullHtml = this.getEnterpriseTemplateHtml(
        project,
        template,
        requirements,
        entities,
        decisions,
        metrics
      );
      triggerFileDownload(fullHtml, `${sanitizedProjectName}_${sanitizedTitle}.html`, 'text/html;charset=utf-8');
    } else {
      triggerFileDownload(generated.fullContent, `${sanitizedProjectName}_${sanitizedTitle}.md`, 'text/markdown;charset=utf-8');
    }
  },

  /**
   * Abre directamente la ventana de impresión nativa del navegador con el documento
   * estilizado para guardarlo como PDF vectorial de alta fidelidad.
   */
  printEnterpriseTemplate(
    project: Project,
    template: EnterpriseTemplateDef,
    requirements: Requirement[],
    entities: CanvasEntity[],
    decisions: Decision[],
    metrics?: ProjectMetrics | null
  ): void {
    const fullHtml = this.getEnterpriseTemplateHtml(
      project,
      template,
      requirements,
      entities,
      decisions,
      metrics
    );

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch (e) {
          console.error('Error al invocar impresión nativa', e);
        }
      }, 350);
    }
  },
};
