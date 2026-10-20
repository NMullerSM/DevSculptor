import { Project } from '../../types/project.types';
import { Requirement } from '../../types/requirement.types';
import { CanvasEntity } from '../../types/canvas.types';
import { Decision } from '../../types/decision.types';
import { ProjectMetrics } from '../../types/metrics.types';
import {
  generatePostgreSqlDdl,
  generateMySqlDdl,
  generateSqliteDdl,
  generateOracleDdl,
  SqlDialect,
} from '../canvas/scriptGenerators';

export type OkfDocumentType =
  | 'OKF_INDEX_MANIFEST'
  | 'REQUIREMENT_SRS'
  | 'ARCHITECTURE_DECISION'
  | 'DDL_SCHEMA'
  | 'DATA_DICTIONARY'
  | 'MERMAID_ERD'
  | 'SKILL'
  | 'PROMPT_BUNDLE'
  | 'KNOWLEDGE_BASE'
  | 'ARCHITECTURE_PATTERN'
  | 'DOCUMENT_TEMPLATE'
  | 'PROJECT_CONTEXT'
  | 'REQUIREMENT_SPEC'
  | 'DECISION_ADR'
  | 'DATABASE_SCHEMA'
  | 'AGENT_SKILL'
  | 'DIAGRAM';

export type OkfFreshnessStatus = 'FRESH' | 'STALE' | 'DRIFT_DETECTED';

export interface OkfMetadataHeader {
  okf_spec: string;
  document_id: string;
  document_type: OkfDocumentType;
  project_id: string;
  project_name: string;
  title: string;
  canonical_path: string;
  tags: string[];
  freshness: {
    status: OkfFreshnessStatus;
    last_verified: string;
    state_hash: string;
    verified_by: string;
  };
  dependencies?: {
    impacted_entities?: string[];
    related_requirements?: string[];
    related_adrs?: string[];
  };
  ai_reading_order?: Array<{
    step: number;
    path: string;
    purpose: string;
  }>;
}

export interface ProcessedOkfDocument {
  id: string;
  path: string;
  filename: string;
  category: 'manifest' | 'documentation' | 'database' | 'skills' | 'context' | 'knowledge' | 'templates';
  description: string;
  content: string;
  header: OkfMetadataHeader;
  rawBody: string;
  stateHash: string;
  freshnessStatus: OkfFreshnessStatus;
}

export interface OkfProcessorInput {
  project: Project;
  requirements: Requirement[];
  entities: CanvasEntity[];
  decisions: Decision[];
  metrics: ProjectMetrics | null;
  sqlDialect?: SqlDialect;
  customVerifier?: string;
  injectedDiagrams?: Array<{ code: string; title: string; type: string; mermaidCode: string; description?: string }>;
}

/**
 * Calcula un hash criptográfico SHA-256 compatible con Browser y Node.js.
 */
export async function computeSha256(text: string): Promise<string> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback si crypto.subtle falla
    }
  }

  // Fallback determinista
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const full = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return full.toString(16).padStart(16, '0') + Math.abs(h1 ^ h2).toString(16).padStart(16, '0');
}

/**
 * Serializa un objeto de metadatos a bloque YAML Frontmatter estricto.
 */
export function formatYamlFrontmatter(header: OkfMetadataHeader): string {
  let yaml = `---\n`;
  yaml += `okf_spec: "${header.okf_spec}"\n`;
  yaml += `document_id: "${header.document_id}"\n`;
  yaml += `document_type: "${header.document_type}"\n`;
  yaml += `project_id: "${header.project_id}"\n`;
  yaml += `project_name: "${header.project_name.replace(/"/g, '\\"')}"\n`;
  yaml += `title: "${header.title.replace(/"/g, '\\"')}"\n`;
  yaml += `canonical_path: "${header.canonical_path}"\n`;

  yaml += `tags:\n`;
  header.tags.forEach((tag) => {
    yaml += `  - "${tag.replace(/"/g, '')}"\n`;
  });

  yaml += `freshness:\n`;
  yaml += `  status: "${header.freshness.status}"\n`;
  yaml += `  last_verified: "${header.freshness.last_verified}"\n`;
  yaml += `  state_hash: "${header.freshness.state_hash}"\n`;
  yaml += `  verified_by: "${header.freshness.verified_by.replace(/"/g, '\\"')}"\n`;

  if (header.dependencies) {
    yaml += `dependencies:\n`;
    if (header.dependencies.impacted_entities && header.dependencies.impacted_entities.length > 0) {
      yaml += `  impacted_entities:\n`;
      header.dependencies.impacted_entities.forEach((e) => {
        yaml += `    - "${e}"\n`;
      });
    }
    if (header.dependencies.related_requirements && header.dependencies.related_requirements.length > 0) {
      yaml += `  related_requirements:\n`;
      header.dependencies.related_requirements.forEach((r) => {
        yaml += `    - "${r}"\n`;
      });
    }
    if (header.dependencies.related_adrs && header.dependencies.related_adrs.length > 0) {
      yaml += `  related_adrs:\n`;
      header.dependencies.related_adrs.forEach((a) => {
        yaml += `    - "${a}"\n`;
      });
    }
  }

  if (header.ai_reading_order && header.ai_reading_order.length > 0) {
    yaml += `ai_reading_order:\n`;
    header.ai_reading_order.forEach((item) => {
      yaml += `  - step: ${item.step}\n`;
      yaml += `    path: "${item.path}"\n`;
      yaml += `    purpose: "${item.purpose.replace(/"/g, '\\"')}"\n`;
    });
  }

  yaml += `---\n\n`;
  return yaml;
}

/**
 * Normaliza nombres de archivo a un formato canónico seguro.
 */
export function sanitizeCanonicalSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 45);
}

/**
 * Infiere tags semánticos a partir del contenido y título del documento.
 */
export function inferSemanticTags(title: string, body: string, baseType: OkfDocumentType): string[] {
  const combined = `${title} ${body}`.toLowerCase();
  const tags = new Set<string>();

  tags.add('okf');
  tags.add('devsculptor');

  switch (baseType) {
    case 'REQUIREMENT_SRS':
      tags.add('ieee-830');
      tags.add('requirements');
      break;
    case 'OKF_INDEX_MANIFEST':
      tags.add('manifest');
      tags.add('okf-index');
      tags.add('ai-protocol');
      tags.add('reading-order');
      tags.add('governance');
      break;
    case 'ARCHITECTURE_DECISION':
      tags.add('adr');
      tags.add('governance');
      tags.add('human-in-the-loop');
      break;
    case 'DDL_SCHEMA':
      tags.add('database');
      tags.add('ddl');
      tags.add('3fn');
      break;
    case 'DATA_DICTIONARY':
      tags.add('database');
      tags.add('dictionary');
      break;
    case 'MERMAID_ERD':
      tags.add('diagram');
      tags.add('mermaid');
      break;
    case 'SKILL':
      tags.add('standard');
      tags.add('architecture');
      break;
    case 'PROMPT_BUNDLE':
      tags.add('ai-context');
      tags.add('cursorrules');
      break;
  }

  if (combined.includes('jwt') || combined.includes('token') || combined.includes('auth')) tags.add('security');
  if (combined.includes('rls') || combined.includes('row level')) tags.add('rls');
  if (combined.includes('monolito') || combined.includes('monolith')) tags.add('monolith');
  if (combined.includes('microservicio') || combined.includes('microservices')) tags.add('microservices');
  if (combined.includes('hexagonal') || combined.includes('clean')) tags.add('clean-architecture');
  if (combined.includes('postgres') || combined.includes('postgresql')) tags.add('postgres');
  if (combined.includes('mysql')) tags.add('mysql');
  if (combined.includes('sqlite')) tags.add('sqlite');
  if (combined.includes('oracle')) tags.add('oracle');
  if (combined.includes('audit') || combined.includes('trigger')) tags.add('audit-trail');

  return Array.from(tags);
}

/**
 * Motor Principal: Procesa todos los artefactos de un proyecto, inyecta YAML Frontmatter
 * y rutea cada documento a su subcarpeta canónica.
 */
export async function processProjectOkfVault(input: OkfProcessorInput): Promise<ProcessedOkfDocument[]> {
  const {
    project,
    requirements,
    entities,
    decisions,
    metrics,
    sqlDialect = 'postgres',
    customVerifier,
  } = input;

  const now = new Date().toISOString();
  const verifier = customVerifier || project.lead_architect || 'Nathaniel Muller (Lead Architect)';
  const documents: ProcessedOkfDocument[] = [];

  // =========================================================================
  // 1. SRS Requisitos IEEE-830 -> /documentation/requirements/
  // =========================================================================
  const rfList = requirements.filter((r) => r.type === 'RF');
  const rnfList = requirements.filter((r) => r.type === 'RNF');
  const maturity = metrics ? Math.round(metrics.maturity_index) : 0;

  let srsBody = `# ${project.name} — Requisitos de Ingeniería de Software (IEEE-830)\n\n`;
  srsBody += `> **Estado de Madurez Arquitectónica:** ${maturity}%\n`;
  srsBody += `> **Estilo Oficial:** ${project.architecture_style || 'En Evaluación'}\n`;
  srsBody += `> **Organización:** ${project.organization || 'DevSculptor'}\n\n`;

  srsBody += `## 1. Alcance y Propósito\n`;
  srsBody += `${project.description || 'Sin descripción detallada provista.'}\n\n`;

  srsBody += `## 2. Requisitos Funcionales (RF)\n\n`;
  srsBody += `| Código | Título | Prioridad | Especificación Técnica |\n`;
  srsBody += `| :---: | :--- | :---: | :--- |\n`;
  if (rfList.length === 0) {
    srsBody += `| - | *No hay requisitos funcionales registrados.* | - | - |\n`;
  } else {
    rfList.forEach((rf) => {
      const cleanDesc = (rf.description || '').replace(/\n/g, ' ').replace(/\|/g, '\\|');
      srsBody += `| **${rf.code}** | ${rf.title} | \`${rf.priority}\` | ${cleanDesc} |\n`;
    });
  }

  srsBody += `\n## 3. Requisitos No Funcionales (RNF)\n\n`;
  srsBody += `| Código | Dimensión | Prioridad | Restricción y Tolerancia |\n`;
  srsBody += `| :---: | :--- | :---: | :--- |\n`;
  if (rnfList.length === 0) {
    srsBody += `| - | *No hay requisitos no funcionales registrados.* | - | - |\n`;
  } else {
    rnfList.forEach((rnf) => {
      const cleanDesc = (rnf.description || '').replace(/\n/g, ' ').replace(/\|/g, '\\|');
      srsBody += `| **${rnf.code}** | ${rnf.title} | \`${rnf.priority}\` | ${cleanDesc} |\n`;
    });
  }

  const srsHash = await computeSha256(srsBody);
  const srsHeader: OkfMetadataHeader = {
    okf_spec: '1.0',
    document_id: `DOC-SRS-${project.id.slice(0, 8)}`,
    document_type: 'REQUIREMENT_SRS',
    project_id: project.id,
    project_name: project.name,
    title: `${project.name} - Especificación de Requisitos IEEE-830`,
    canonical_path: 'documentation/requirements/SRS_Requisitos_IEEE830.md',
    tags: inferSemanticTags(project.name, srsBody, 'REQUIREMENT_SRS'),
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: srsHash,
      verified_by: verifier,
    },
    dependencies: {
      related_requirements: requirements.map((r) => r.code),
    },
  };

  documents.push({
    id: srsHeader.document_id,
    path: srsHeader.canonical_path,
    filename: 'SRS_Requisitos_IEEE830.md',
    category: 'documentation',
    description: 'Documento unificado de requisitos IEEE-830 clasificados (RF/RNF)',
    content: `${formatYamlFrontmatter(srsHeader)}${srsBody}`,
    header: srsHeader,
    rawBody: srsBody,
    stateHash: srsHash,
    freshnessStatus: 'FRESH',
  });

  // =========================================================================
  // 2. Catálogo de ADRs -> /documentation/adrs/
  // =========================================================================
  let adrIndexBody = `# ${project.name} — Catálogo de Decisiones de Arquitectura (ADRs)\n\n`;
  adrIndexBody += `Registro formal de actas bajo formato Michael Nygard y gobernanza Human-in-the-Loop:\n\n`;
  adrIndexBody += `| ID | Título | Estado | Fecha |\n`;
  adrIndexBody += `| :---: | :--- | :---: | :---: |\n`;

  if (decisions.length === 0) {
    adrIndexBody += `| - | *No se han ratificado actas ADR para este proyecto.* | - | - |\n`;
  }

  for (let i = 0; i < decisions.length; i++) {
    const adr = decisions[i];
    const adrCode = `ADR-${String(i + 1).padStart(3, '0')}`;
    const slug = sanitizeCanonicalSlug(adr.title);
    const filename = `${adrCode}_${slug}.md`;
    const relPath = `documentation/adrs/${filename}`;

    const date = adr.created_at ? adr.created_at.split('T')[0] : now.split('T')[0];
    adrIndexBody += `| [**${adrCode}**](./${filename}) | ${adr.title} | \`${adr.status}\` | ${date} |\n`;

    let adrBody = `# ${adrCode}: ${adr.title}\n\n`;
    adrBody += `* **Proyecto:** ${project.name}\n`;
    adrBody += `* **Estado Oficial:** \`${adr.status}\`\n`;
    adrBody += `* **Fecha de Registro:** ${date}\n\n`;
    adrBody += `## 1. Contexto y Problema\n${adr.context || 'Sin contexto documentado.'}\n\n`;
    adrBody += `## 2. Decisión Arquitectónica\n${adr.decision || 'Sin especificación de decisión.'}\n\n`;
    adrBody += `## 3. Consecuencias y Compromisos Técnicos\n`;
    adrBody += `- Ratificado formalmente en el Estudio de Gobernanza de DevSculptor.\n`;
    adrBody += `- Requiere acta complementaria o revocatoria para cualquier transición futura.\n`;

    const singleAdrHash = await computeSha256(adrBody);
    const singleAdrHeader: OkfMetadataHeader = {
      okf_spec: '1.0',
      document_id: `DOC-${adrCode}`,
      document_type: 'ARCHITECTURE_DECISION',
      project_id: project.id,
      project_name: project.name,
      title: `${adrCode}: ${adr.title}`,
      canonical_path: relPath,
      tags: inferSemanticTags(adr.title, adrBody, 'ARCHITECTURE_DECISION'),
      freshness: {
        status: 'FRESH',
        last_verified: now,
        state_hash: singleAdrHash,
        verified_by: verifier,
      },
      dependencies: {
        related_adrs: [adrCode],
      },
    };

    documents.push({
      id: singleAdrHeader.document_id,
      path: relPath,
      filename,
      category: 'documentation',
      description: `Acta de decisión técnica: ${adr.title} (${adr.status})`,
      content: `${formatYamlFrontmatter(singleAdrHeader)}${adrBody}`,
      header: singleAdrHeader,
      rawBody: adrBody,
      stateHash: singleAdrHash,
      freshnessStatus: 'FRESH',
    });
  }

  // Índice de ADRs
  const adrIndexHash = await computeSha256(adrIndexBody);
  const adrIndexHeader: OkfMetadataHeader = {
    okf_spec: '1.0',
    document_id: `DOC-ADR-INDEX-${project.id.slice(0, 8)}`,
    document_type: 'ARCHITECTURE_DECISION',
    project_id: project.id,
    project_name: project.name,
    title: `${project.name} - Índice Maestro de ADRs`,
    canonical_path: 'documentation/adrs/ADR_INDEX.md',
    tags: ['okf', 'adr', 'index', 'governance'],
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: adrIndexHash,
      verified_by: verifier,
    },
  };

  documents.push({
    id: adrIndexHeader.document_id,
    path: adrIndexHeader.canonical_path,
    filename: 'ADR_INDEX.md',
    category: 'documentation',
    description: 'Índice maestro de Decisiones de Arquitectura (ADRs)',
    content: `${formatYamlFrontmatter(adrIndexHeader)}${adrIndexBody}`,
    header: adrIndexHeader,
    rawBody: adrIndexBody,
    stateHash: adrIndexHash,
    freshnessStatus: 'FRESH',
  });

  // =========================================================================
  // 3. Base de Datos DDL -> /database/schemas/
  // =========================================================================
  let ddlContent = '';
  let ddlFilename = '';
  switch (sqlDialect) {
    case 'mysql':
      ddlContent = generateMySqlDdl(entities);
      ddlFilename = 'schema_ddl_mysql.sql';
      break;
    case 'sqlite':
      ddlContent = generateSqliteDdl(entities);
      ddlFilename = 'schema_ddl_sqlite.sql';
      break;
    case 'oracle':
      ddlContent = generateOracleDdl(entities);
      ddlFilename = 'schema_ddl_oracle.sql';
      break;
    case 'postgres':
    default:
      ddlContent = generatePostgreSqlDdl(entities);
      ddlFilename = 'schema_ddl_postgres.sql';
      break;
  }

  const ddlPath = `database/schemas/${ddlFilename}`;
  const ddlHash = await computeSha256(ddlContent);
  const ddlHeader: OkfMetadataHeader = {
    okf_spec: '1.0',
    document_id: `DOC-DDL-${sqlDialect.toUpperCase()}`,
    document_type: 'DDL_SCHEMA',
    project_id: project.id,
    project_name: project.name,
    title: `Script DDL ${sqlDialect.toUpperCase()} (3FN Normalizado)`,
    canonical_path: ddlPath,
    tags: inferSemanticTags(ddlFilename, ddlContent, 'DDL_SCHEMA'),
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: ddlHash,
      verified_by: verifier,
    },
    dependencies: {
      impacted_entities: entities.map((e) => e.table_name),
    },
  };

  documents.push({
    id: ddlHeader.document_id,
    path: ddlPath,
    filename: ddlFilename,
    category: 'database',
    description: `Sentencias DDL 3FN compiladas para ${sqlDialect.toUpperCase()}`,
    content: `-- ${formatYamlFrontmatter(ddlHeader).replace(/\n/g, '\n-- ')}\n${ddlContent}`,
    header: ddlHeader,
    rawBody: ddlContent,
    stateHash: ddlHash,
    freshnessStatus: 'FRESH',
  });

  // =========================================================================
  // 4. Diccionario de Datos -> /database/dictionaries/
  // =========================================================================
  let dictBody = `# ${project.name} — Diccionario de Datos Relacional (3FN)\n\n`;
  dictBody += `Catálogo detallado de entidades, tipos y constraints modeladas en el Canvas ERD:\n\n`;

  if (entities.length === 0) {
    dictBody += `*No hay tablas definidas en el modelo relacional.*\n`;
  } else {
    entities.forEach((entity) => {
      dictBody += `### Tabla: \`${entity.table_name}\`\n\n`;
      dictBody += `| Columna | Tipo | PK | FK | Referencia | Nulo | Único |\n`;
      dictBody += `| :--- | :---: | :---: | :---: | :--- | :---: | :---: |\n`;

      const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
      cols.forEach((col) => {
        const isPk = col.isPk || col.is_pk ? '✅' : '—';
        const targetTable = col.referencesTable || col.references_table;
        const targetCol = col.referencesColumn || col.references_column || 'id';
        const isFk = col.isFk || col.is_fk || targetTable ? '✅' : '—';
        const ref = targetTable ? `\`${targetTable}.${targetCol}\`` : '—';
        const nullable = col.nullable === false ? 'No' : 'Sí';
        const unique = col.unique ? 'Sí' : 'No';
        dictBody += `| \`${col.name}\` | \`${col.type}\` | ${isPk} | ${isFk} | ${ref} | ${nullable} | ${unique} |\n`;
      });
      dictBody += `\n`;
    });
  }

  const dictHash = await computeSha256(dictBody);
  const dictHeader: OkfMetadataHeader = {
    okf_spec: '1.0',
    document_id: `DOC-DICT-${project.id.slice(0, 8)}`,
    document_type: 'DATA_DICTIONARY',
    project_id: project.id,
    project_name: project.name,
    title: `${project.name} - Diccionario de Datos (3FN)`,
    canonical_path: 'database/dictionaries/DATA_DICTIONARY.md',
    tags: inferSemanticTags(project.name, dictBody, 'DATA_DICTIONARY'),
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: dictHash,
      verified_by: verifier,
    },
    dependencies: {
      impacted_entities: entities.map((e) => e.table_name),
    },
  };

  documents.push({
    id: dictHeader.document_id,
    path: dictHeader.canonical_path,
    filename: 'DATA_DICTIONARY.md',
    category: 'database',
    description: 'Diccionario de datos tabulado con restricciones e integridad referencial',
    content: `${formatYamlFrontmatter(dictHeader)}${dictBody}`,
    header: dictHeader,
    rawBody: dictBody,
    stateHash: dictHash,
    freshnessStatus: 'FRESH',
  });

  // =========================================================================
  // 5. Diagrama Mermaid ERD -> /database/dictionaries/ERD_DIAGRAM.md
  // =========================================================================
  let mermaidBody = `# ${project.name} — Diagrama Entidad-Relación (Mermaid)\n\n`;
  mermaidBody += `Renderizado visual del esquema relacional en sintaxis estándar Mermaid:\n\n`;
  mermaidBody += `\`\`\`mermaid\nerDiagram\n`;

  if (entities.length === 0) {
    mermaidBody += `    EMPTY_MODEL {\n        string info "Sin tablas"\n    }\n`;
  } else {
    entities.forEach((entity) => {
      mermaidBody += `    ${entity.table_name} {\n`;
      const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
      cols.forEach((c) => {
        const sanitizedType = c.type.replace(/\s+/g, '_').replace(/[(),]/g, '_');
        const pkFlag = c.isPk || c.is_pk ? 'PK' : '';
        const fkFlag = c.isFk || c.is_fk || c.referencesTable || c.references_table ? 'FK' : '';
        const flags = [pkFlag, fkFlag].filter(Boolean).join(',');
        mermaidBody += `        ${sanitizedType} ${c.name} ${flags ? `"${flags}"` : ''}\n`;
      });
      mermaidBody += `    }\n`;
    });

    mermaidBody += `\n`;

    // Relaciones
    entities.forEach((entity) => {
      const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
      cols.forEach((c) => {
        const targetTable = c.referencesTable || c.references_table;
        if (targetTable) {
          const cardinality = c.cardinality || '1:N';
          let rel = '||--o{';
          if (cardinality === '1:1') rel = '||--||';
          if (cardinality === 'N:M') rel = '}o--o{';
          mermaidBody += `    ${targetTable} ${rel} ${entity.table_name} : "fk_${c.name}"\n`;
        }
      });
    });
  }
  mermaidBody += `\`\`\`\n`;

  const mermaidHash = await computeSha256(mermaidBody);
  const mermaidHeader: OkfMetadataHeader = {
    okf_spec: '1.0',
    document_id: `DOC-ERD-${project.id.slice(0, 8)}`,
    document_type: 'MERMAID_ERD',
    project_id: project.id,
    project_name: project.name,
    title: `${project.name} - Diagrama Entidad-Relación Mermaid`,
    canonical_path: 'database/dictionaries/ERD_DIAGRAM.md',
    tags: ['okf', 'database', 'erd', 'mermaid', 'diagram'],
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: mermaidHash,
      verified_by: verifier,
    },
    dependencies: {
      impacted_entities: entities.map((e) => e.table_name),
    },
  };

  documents.push({
    id: mermaidHeader.document_id,
    path: mermaidHeader.canonical_path,
    filename: 'ERD_DIAGRAM.md',
    category: 'database',
    description: 'Diagrama Entidad-Relación en sintaxis Mermaid para renderizado visual',
    content: `${formatYamlFrontmatter(mermaidHeader)}${mermaidBody}`,
    header: mermaidHeader,
    rawBody: mermaidBody,
    stateHash: mermaidHash,
    freshnessStatus: 'FRESH',
  });

  // =========================================================================
  // 5.5. Diagramas de Arquitectura Asistidos por IA -> /documentation/diagrams/
  // =========================================================================
  if (input.injectedDiagrams && input.injectedDiagrams.length > 0) {
    for (const diag of input.injectedDiagrams) {
      const slug = sanitizeCanonicalSlug(diag.title || diag.code);
      const filename = `${diag.code}_${slug}.md`;
      const relPath = `documentation/diagrams/${filename}`;

      let diagBody = `# ${diag.title} (${diag.code})\n\n`;
      diagBody += `* **Proyecto:** ${project.name}\n`;
      diagBody += `* **Tipo de Diagrama:** \`${diag.type}\`\n`;
      diagBody += `* **Formato:** \`Mermaid UML\`\n\n`;
      if (diag.description) {
        diagBody += `> ${diag.description}\n\n`;
      }
      diagBody += `\`\`\`mermaid\n${diag.mermaidCode}\n\`\`\`\n`;

      const diagHash = await computeSha256(diagBody);
      const diagHeader: OkfMetadataHeader = {
        okf_spec: '1.0',
        document_id: `DOC-DIAG-${diag.code}`,
        document_type: 'DIAGRAM',
        project_id: project.id,
        project_name: project.name,
        title: `${diag.code}: ${diag.title}`,
        canonical_path: relPath,
        tags: ['okf', 'diagram', 'mermaid', diag.type, 'ai-generated'],
        freshness: {
          status: 'FRESH',
          last_verified: now,
          state_hash: diagHash,
          verified_by: verifier,
        },
      };

      documents.push({
        id: diagHeader.document_id,
        path: relPath,
        filename,
        category: 'documentation',
        description: `Diagrama de arquitectura ${diag.type}: ${diag.title}`,
        content: `${formatYamlFrontmatter(diagHeader)}${diagBody}`,
        header: diagHeader,
        rawBody: diagBody,
        stateHash: diagHash,
        freshnessStatus: 'FRESH',
      });
    }
  }

  // =========================================================================
  // 6. Skill Metodológico -> /skills/devsculptor-architect.md
  // =========================================================================
  const skillBody = `# DevSculptor Architect — Manual de Conducta y Estándar de Ingeniería

## 1. Filosofía Central
- **Cero Vibe Coding:** Prohibido programar sin requisitos (IEEE-830), modelo de datos (3FN) y decisiones documentadas (ADRs).
- **TypeScript Estricto:** \`strict: true\`, cero uso de \`any\`, DTOs con Zod como única fuente de verdad.
- **Aislamiento Horizontal:** Multi-inquilino estricto forzando \`user_id\` autenticado en cada consulta.

## 2. Pilares de Calidad
1. TypeScript Estricto.
2. SQL Parametrizado Absoluto ($1, $2).
3. DTOs Zod como SSOT.
4. Jerarquía de Excepciones Tipadas.
5. Envelope Uniforme de Respuesta HTTP.
6. Observabilidad y Trazabilidad por \`X-Request-Id\`.
7. Aislamiento Horizontal y Código 404 ante accesos no autorizados.
8. Blindaje RLS en Motor y Cloud.
`;

  const skillHash = await computeSha256(skillBody);
  const skillHeader: OkfMetadataHeader = {
    okf_spec: '1.0',
    document_id: 'DOC-SKILL-ARCHITECT',
    document_type: 'SKILL',
    project_id: project.id,
    project_name: project.name,
    title: 'Manual de Ingeniería DevSculptor Architect',
    canonical_path: 'skills/devsculptor-architect.md',
    tags: ['okf', 'skill', 'standard', 'architecture', 'anti-vibe-coding'],
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: skillHash,
      verified_by: verifier,
    },
  };

  documents.push({
    id: skillHeader.document_id,
    path: skillHeader.canonical_path,
    filename: 'devsculptor-architect.md',
    category: 'skills',
    description: 'Manual metodológico y estándar de ingeniería de software para el proyecto',
    content: `${formatYamlFrontmatter(skillHeader)}${skillBody}`,
    header: skillHeader,
    rawBody: skillBody,
    stateHash: skillHash,
    freshnessStatus: 'FRESH',
  });

  // =========================================================================
  // 7. Prompt Bundles para IA Externa -> /context/
  // =========================================================================
  // 7.1. PROMPT_MAESTRO_CONTEXTO.md
  let promptMaestroBody = `# Prompt Maestro de Contexto Técnico — ${project.name}\n\n`;
  promptMaestroBody += `> **Instrucción para el LLM (Cursor, Claude, ChatGPT, NotebookLM):**\n`;
  promptMaestroBody += `> Actúa como un Ingeniero de Software y Arquitecto Senior. El siguiente contexto representa la ÚNICA FUENTE DE VERDAD (SSOT) del proyecto **${project.name}**. No asumas bibliotecas externas, no agregues dependencias innecesarias y no alteres el modelo relacional sin proponer un acta ADR.\n\n`;
  promptMaestroBody += `### Metadatos del Sistema\n`;
  promptMaestroBody += `- **Estilo Arquitectónico:** ${project.architecture_style || 'Monolito Modular'}\n`;
  promptMaestroBody += `- **Organización:** ${project.organization || 'DevSculptor'}\n`;
  promptMaestroBody += `- **Madurez Documental:** ${maturity}%\n\n`;

  promptMaestroBody += `### Resumen de Requisitos Funcionales Críticos\n`;
  rfList.slice(0, 10).forEach((rf) => {
    promptMaestroBody += `- **${rf.code}:** ${rf.title} (Prioridad: ${rf.priority})\n`;
  });

  promptMaestroBody += `\n### Esquema Relacional de Tablas (3FN)\n`;
  entities.forEach((e) => {
    const cols = Array.isArray(e.columns_json) ? e.columns_json.map((c) => c.name).join(', ') : '';
    promptMaestroBody += `- **${e.table_name}:** (${cols})\n`;
  });

  promptMaestroBody += `\n### Actas de Decisión Inmutables (ADRs Aceptadas)\n`;
  decisions.filter((d) => d.status === 'ACCEPTED').forEach((d, idx) => {
    promptMaestroBody += `- **ADR-${String(idx + 1).padStart(3, '0')} (${d.title}):** ${d.decision}\n`;
  });

  const promptMaestroHash = await computeSha256(promptMaestroBody);
  const promptMaestroHeader: OkfMetadataHeader = {
    okf_spec: '1.0',
    document_id: 'DOC-PROMPT-MAESTRO',
    document_type: 'PROMPT_BUNDLE',
    project_id: project.id,
    project_name: project.name,
    title: `${project.name} - Prompt Maestro de Contexto para IA`,
    canonical_path: 'context/PROMPT_MAESTRO_CONTEXTO.md',
    tags: ['okf', 'context', 'prompt', 'llm-injection', 'token-minified'],
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: promptMaestroHash,
      verified_by: verifier,
    },
    dependencies: {
      impacted_entities: entities.map((e) => e.table_name),
      related_requirements: rfList.map((r) => r.code),
    },
  };

  documents.push({
    id: promptMaestroHeader.document_id,
    path: promptMaestroHeader.canonical_path,
    filename: 'PROMPT_MAESTRO_CONTEXTO.md',
    category: 'context',
    description: 'Prompt maestro minificado en tokens para alimentar modelos de IA externos',
    content: `${formatYamlFrontmatter(promptMaestroHeader)}${promptMaestroBody}`,
    header: promptMaestroHeader,
    rawBody: promptMaestroBody,
    stateHash: promptMaestroHash,
    freshnessStatus: 'FRESH',
  });

  // 7.2. .cursorrules
  let cursorRulesBody = `# Cursor AI Rules — ${project.name}\n`;
  cursorRulesBody += `# Generado automáticamente por DevSculptor OKF Engine\n\n`;
  cursorRulesBody += `You are an expert software engineer adhering strictly to the architecture of ${project.name}.\n\n`;
  cursorRulesBody += `## Core Architectural Directives\n`;
  cursorRulesBody += `1. **Architectural Style:** ${project.architecture_style || 'Modular Monolith (Layered MVC)'}.\n`;
  cursorRulesBody += `2. **Strict Mode:** TypeScript with zero 'any'. All inputs validated with Zod schemas.\n`;
  cursorRulesBody += `3. **Database Rules:** PostgreSQL 15+. Always use positional parameters ($1, $2), never raw string concatenation.\n`;
  cursorRulesBody += `4. **Security:** Multi-tenant horizontal isolation. Never trust user_id from request body; extract exclusively from authenticated token.\n`;
  cursorRulesBody += `5. **Tables Available:** ${entities.map((e) => e.table_name).join(', ') || 'See schema_ddl.sql'}.\n`;

  const cursorRulesHash = await computeSha256(cursorRulesBody);
  const cursorRulesHeader: OkfMetadataHeader = {
    okf_spec: '1.0',
    document_id: 'DOC-CURSORRULES',
    document_type: 'PROMPT_BUNDLE',
    project_id: project.id,
    project_name: project.name,
    title: `${project.name} - Reglas Cursor (.cursorrules)`,
    canonical_path: 'context/.cursorrules',
    tags: ['okf', 'context', 'cursorrules', 'cursor-ai', 'agent-rules'],
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: cursorRulesHash,
      verified_by: verifier,
    },
  };

  documents.push({
    id: cursorRulesHeader.document_id,
    path: cursorRulesHeader.canonical_path,
    filename: '.cursorrules',
    category: 'context',
    description: 'Archivo .cursorrules preconfigurado para desarrollo guiado en Cursor AI',
    content: cursorRulesBody,
    header: cursorRulesHeader,
    rawBody: cursorRulesBody,
    stateHash: cursorRulesHash,
    freshnessStatus: 'FRESH',
  });

  // 7.3. CLAUDE.md
  let claudeMdBody = `# Claude Code Architecture Guide — ${project.name}\n\n`;
  claudeMdBody += `## Project Overview\n`;
  claudeMdBody += `- **Name:** ${project.name}\n`;
  claudeMdBody += `- **Architecture:** ${project.architecture_style || 'Modular Monolith'}\n`;
  claudeMdBody += `- **Maturity Index:** ${maturity}%\n\n`;
  claudeMdBody += `## Key Conventions\n`;
  claudeMdBody += `- Adhere to IEEE-830 requirements defined in \`documentation/requirements/SRS_Requisitos_IEEE830.md\`.\n`;
  claudeMdBody += `- Adhere to ADRs defined in \`documentation/adrs/\`.\n`;
  claudeMdBody += `- Maintain database 3FN normalized schema defined in \`database/schemas/\`.\n`;

  const claudeMdHash = await computeSha256(claudeMdBody);
  const claudeMdHeader: OkfMetadataHeader = {
    okf_spec: '1.0.0',
    document_id: 'DOC-CLAUDE-MD',
    document_type: 'PROMPT_BUNDLE',
    project_id: project.id,
    project_name: project.name,
    title: `${project.name} - Guía Claude (CLAUDE.md)`,
    canonical_path: 'context/CLAUDE.md',
    tags: ['okf', 'context', 'claude', 'anthropic', 'agent-rules'],
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: claudeMdHash,
      verified_by: verifier,
    },
  };

  documents.push({
    id: claudeMdHeader.document_id,
    path: claudeMdHeader.canonical_path,
    filename: 'CLAUDE.md',
    category: 'context',
    description: 'Archivo de contexto y comandos para Claude Code y asistentes Anthropic',
    content: `${formatYamlFrontmatter(claudeMdHeader)}${claudeMdBody}`,
    header: claudeMdHeader,
    rawBody: claudeMdBody,
    stateHash: claudeMdHash,
    freshnessStatus: 'FRESH',
  });

  // =========================================================================
  // 8. Manifiesto Maestro OKF & Protocolo de Ingestión IA -> /INDEX.md
  // =========================================================================
  const aiReadingOrder = [
    {
      step: 1,
      path: 'INDEX.md',
      purpose: 'Manifiesto maestro, inventario de integridad criptográfica y mapa de navegación',
    },
    {
      step: 2,
      path: 'context/PROMPT_MAESTRO_CONTEXTO.md',
      purpose: 'Identidad, stack tecnológico, puertos y restricciones globales del proyecto',
    },
    {
      step: 3,
      path: 'skills/devsculptor-architect.md',
      purpose: 'Directrices de ingeniería, reglas de codificación estricta y arquitectura transversal',
    },
    {
      step: 4,
      path: 'documentation/requirements/SRS_Requisitos_IEEE830.md',
      purpose: 'Catálogo oficial de Requisitos Funcionales (RF) y No Funcionales (RNF) bajo IEEE-830',
    },
    {
      step: 5,
      path: 'documentation/adrs/ADR_INDEX.md',
      purpose: 'Registro consolidado de Decisiones de Arquitectura (ADRs) ratificadas e inmutables',
    },
    {
      step: 6,
      path: `database/schemas/schema_ddl_${sqlDialect}.sql`,
      purpose: 'DDL físico relacional, tablas, tipos, claves primarias, foráneas e índices',
    },
    {
      step: 7,
      path: 'database/dictionaries/DATA_DICTIONARY.md',
      purpose: 'Diccionario exhaustivo de entidades, atributos, cardinalidades y diagramas',
    },
    {
      step: 8,
      path: 'context/.cursorrules',
      purpose: 'Reglas de comportamiento y contexto de sistema para Cursor AI IDE',
    },
    {
      step: 9,
      path: 'context/CLAUDE.md',
      purpose: 'Guía de comandos de desarrollo, test y convención de estilo para Claude Code',
    },
  ];

  let indexBody = `# 🏛️ ${project.name} — Bóveda de Gobernanza Canónica OKF\n\n`;
  indexBody += `> **Especificación:** One Knowledge Format (OKF v1.0.0)\n`;
  indexBody += `> **Organización:** ${project.organization || 'DevSculptor'}\n`;
  indexBody += `> **Líder Arquitecto:** ${verifier}\n`;
  indexBody += `> **Estilo de Arquitectura:** ${project.architecture_style || 'Monolito Modular Layered MVC'}\n`;
  indexBody += `> **Estado de Madurez:** ${maturity}%\n`;
  indexBody += `> **Generado el:** ${now}\n\n`;

  indexBody += `---\n\n`;
  indexBody += `## 🤖 Protocolo de Ingestión Secuencial para Modelos de Lenguaje (LLMs)\n\n`;
  indexBody += `Cualquier agente de inteligencia artificial (Cursor, Claude Code, GitHub Copilot, Gemini CLI, Aider, Devin) o ingeniero que se incorpore a este proyecto **DEBE leer y procesar los documentos en el siguiente orden estricto** para garantizar comprensión holística sin alucinaciones ni desviaciones arquitectónicas:\n\n`;

  indexBody += `| Paso | Archivo | Propósito / Qué aprender de este archivo |\n`;
  indexBody += `| :---: | :--- | :--- |\n`;
  aiReadingOrder.forEach((item) => {
    indexBody += `| **${item.step}** | [\`${item.path}\`](./${item.path}) | ${item.purpose} |\n`;
  });
  indexBody += `\n---\n\n`;

  indexBody += `## 📂 Jerarquía Canónica de Archivos en la Bóveda\n\n`;
  indexBody += `\`\`\`text\n`;
  indexBody += `.\n`;
  indexBody += `├── INDEX.md                                       # [ESTE ARCHIVO] Manifiesto maestro y protocolo de IA\n`;
  indexBody += `├── documentation/\n`;
  indexBody += `│   ├── requirements/\n`;
  indexBody += `│   │   └── SRS_Requisitos_IEEE830.md              # Requisitos de software IEEE-830\n`;
  indexBody += `│   └── adrs/\n`;
  indexBody += `│       ├── ADR_INDEX.md                           # Índice consolidado de decisiones\n`;
  decisions.slice(0, 3).forEach((d, i) => {
    const adrCode = d.code || `ADR-${String(i + 1).padStart(3, '0')}`;
    const dSlug = sanitizeCanonicalSlug(d.title);
    indexBody += `│       ├── ${adrCode}_${dSlug.substring(0, 20)}.md\n`;
  });
  if (decisions.length > 3) {
    indexBody += `│       └── ... (${decisions.length - 3} ADRs adicionales)\n`;
  }
  indexBody += `├── database/\n`;
  indexBody += `│   ├── schemas/\n`;
  indexBody += `│   │   └── schema_ddl_${sqlDialect}.sql               # Esquema DDL físico (${sqlDialect.toUpperCase()})\n`;
  indexBody += `│   └── dictionaries/\n`;
  indexBody += `│       ├── DATA_DICTIONARY.md                     # Diccionario de datos de entidades\n`;
  indexBody += `│       └── ERD_DIAGRAM.md                         # Diagrama Entidad-Relación Mermaid\n`;
  indexBody += `├── skills/\n`;
  indexBody += `│   └── devsculptor-architect.md                   # Manual de conducta técnica y estilo\n`;
  indexBody += `└── context/\n`;
  indexBody += `    ├── PROMPT_MAESTRO_CONTEXTO.md                 # Contexto unificado de arquitectura\n`;
  indexBody += `    ├── .cursorrules                               # Configuración de contexto para Cursor\n`;
  indexBody += `    └── CLAUDE.md                                  # Guía de comandos para Claude Code\n`;
  indexBody += `\`\`\`\n\n`;

  indexBody += `---\n\n`;
  indexBody += `## 📋 Inventario de Artefactos y Hashes de Integridad (SHA-256)\n\n`;
  indexBody += `| Documento | Categoría | Hash SHA-256 (Estado) | Vigencia |\n`;
  indexBody += `| :--- | :--- | :--- | :---: |\n`;
  documents.forEach((d) => {
    indexBody += `| [\`${d.path}\`](./${d.path}) | \`${d.category}\` | \`${d.stateHash.substring(0, 16)}...\` | \`${d.freshnessStatus}\` |\n`;
  });
  indexBody += `\n---\n\n`;

  indexBody += `## 🛡️ Guardarraíles de Arquitectura para la Inteligencia Artificial\n\n`;
  indexBody += `1. **Inmutabilidad de Decisiones (ADRs):** Ningún agente debe sugerir cambios de dependencias o patrones que contradigan los ADRs aprobados en \`documentation/adrs/\`.\n`;
  indexBody += `2. **Gobernanza de Base de Datos:** Toda tabla, columna o relación debe adherirse al diccionario de datos en \`database/dictionaries/\` y sus tipos SQL canónicos.\n`;
  indexBody += `3. **Calidad de Tipado y Seguridad:** Cumplimiento irrestricto de las directrices en \`skills/devsculptor-architect.md\` (TypeScript estricto, cero \`any\`, sanitización de entradas con Zod y parámetros posicionales en consultas SQL).\n`;

  const indexHash = await computeSha256(indexBody);
  const indexHeader: OkfMetadataHeader = {
    okf_spec: '1.0.0',
    document_id: 'OKF-INDEX-001',
    document_type: 'OKF_INDEX_MANIFEST',
    project_id: project.id,
    project_name: project.name,
    title: `${project.name} - Manifiesto Maestro OKF e Índice de Ingestión IA`,
    canonical_path: 'INDEX.md',
    tags: inferSemanticTags(project.name, project.description || '', 'OKF_INDEX_MANIFEST'),
    freshness: {
      status: 'FRESH',
      last_verified: now,
      state_hash: indexHash,
      verified_by: verifier,
    },
    ai_reading_order: aiReadingOrder,
  };

  const indexDoc: ProcessedOkfDocument = {
    id: indexHeader.document_id,
    path: 'INDEX.md',
    filename: 'INDEX.md',
    category: 'manifest',
    description: 'Manifiesto maestro de la bóveda OKF con protocolo de lectura secuencial para IA',
    content: `${formatYamlFrontmatter(indexHeader)}${indexBody}`,
    header: indexHeader,
    rawBody: indexBody,
    stateHash: indexHash,
    freshnessStatus: 'FRESH',
  };

  // Prepend para que sea el primer documento en la bóveda
  documents.unshift(indexDoc);

  return documents;
}
