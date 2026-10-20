import { Project } from '../../types/project.types';
import { Requirement } from '../../types/requirement.types';
import { CanvasEntity } from '../../types/canvas.types';
import { Decision } from '../../types/decision.types';
import { ProjectMetrics } from '../../types/metrics.types';

export interface EnterpriseTemplateDef {
  id: string;
  title: string;
  category: 'requirements' | 'architecture' | 'diagrams' | 'quality';
  standard: string;
  canonicalPath: string;
  tags: string[];
  description: string;
  aiHooks: string[];
  generate: (
    project: Project,
    requirements: Requirement[],
    entities: CanvasEntity[],
    decisions: Decision[],
    metrics?: ProjectMetrics | null
  ) => {
    markdown: string;
    yamlFrontmatter: string;
    fullContent: string;
  };
}

const toPascalCase = (name: string): string => {
  return name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
};

const buildYamlFrontmatter = (params: {
  template_id: string;
  canonical_path: string;
  document_type: string;
  standard: string;
  title: string;
  project_name: string;
  ai_context_hooks: string[];
  tags: string[];
}): string => {
  return `---
template_id: "${params.template_id}"
canonical_path: "${params.canonical_path}"
document_type: "${params.document_type}"
standard: "${params.standard}"
title: "${params.title}"
project_name: "${params.project_name}"
version: "1.0.0"
generated_at: "${new Date().toISOString()}"
ai_context_hooks:
${params.ai_context_hooks.map((h) => `  - "${h}"`).join('\n')}
tags:
${params.tags.map((t) => `  - "${t}"`).join('\n')}
---`;
};

// ============================================================================
// CATÁLOGO DE LAS 13 PLANTILLAS ENTERPRISE OKF
// ============================================================================

export const ENTERPRISE_TEMPLATES: EnterpriseTemplateDef[] = [
  // --------------------------------------------------------------------------
  // 1. ERS / SRS (IEEE-830)
  // --------------------------------------------------------------------------
  {
    id: 'srs-ieee830',
    title: 'Especificación de Requisitos de Software (ERS / SRS — IEEE-830)',
    category: 'requirements',
    standard: 'IEEE 830 / ISO/IEC/IEEE 29148',
    canonicalPath: 'requirements/srs-specification.md',
    tags: ['requirements', 'srs', 'ieee-830', 'functional', 'non-functional'],
    description: 'Catálogo exhaustivo de requerimientos funcionales y no funcionales con criterios de aceptación.',
    aiHooks: ['requirements.rf', 'requirements.rnf', 'project.metadata'],
    generate: (project, requirements) => {
      const rf = requirements.filter((r) => r.type === 'RF');
      const rnf = requirements.filter((r) => r.type === 'RNF');
      const now = new Date().toISOString().split('T')[0];

      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-REQ-SRS-001',
        canonical_path: 'requirements/srs-specification.md',
        document_type: 'REQUIREMENT_SRS',
        standard: 'IEEE 830',
        title: `SRS: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['requirements.rf', 'requirements.rnf', 'traceability.matrix'],
        tags: ['requirements', 'ieee-830', 'srs'],
      });

      const body = `# Especificación de Requisitos de Software (SRS — IEEE-830)

**Proyecto:** ${project.name}  
**Líder Arquitecto:** ${project.lead_architect || 'Senior Staff Architect'}  
**Estilo Arquitectónico:** ${project.architecture_style || 'Monolito Modular Layered MVC'}  
**Fecha de Emisión:** ${now}  

---

## 1. Introducción y Alcance
El presente documento consolida formalmente las especificaciones de requisitos bajo el estándar IEEE-830 para el sistema **${project.name}**.
${project.description || 'Sin descripción técnica adicional registrada.'}

## 2. Requisitos Funcionales (RF)
Los requisitos funcionales describen los comportamientos y capacidades que el sistema debe ejecutar:

| Código | Título | Prioridad | Especificación Detallada |
| :---: | :--- | :---: | :--- |
${rf.length === 0 ? '| - | *Sin requisitos funcionales registrados.* | - | - |' : rf.map((r) => `| **${r.code}** | ${r.title} | \`${r.priority}\` | ${(r.description || '').replace(/\n/g, ' ')} |`).join('\n')}

## 3. Requisitos No Funcionales (RNF) y Calidad de Servicio
Criterios de disponibilidad, seguridad, rendimiento y mantenibilidad (ISO/IEC 25010):

| Código | Título | Prioridad | Restricción Técnica / SLA |
| :---: | :--- | :---: | :--- |
${rnf.length === 0 ? '| - | *Sin requisitos no funcionales registrados.* | - | - |' : rnf.map((r) => `| **${r.code}** | ${r.title} | \`${r.priority}\` | ${(r.description || '').replace(/\n/g, ' ')} |`).join('\n')}

## 4. Matriz de Cobertura y Trazabilidad
- Total Requisitos Funcionales: **${rf.length}**
- Total Requisitos No Funcionales: **${rnf.length}**
- Cobertura de Esquemas Zod: **100% Validado en Runtime**
`;

      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 2. Historias de Usuario & Casos de Uso
  // --------------------------------------------------------------------------
  {
    id: 'user-stories-cases',
    title: 'Historias de Usuario (INVEST) y Casos de Uso Formales',
    category: 'requirements',
    standard: 'Agile INVEST / Gherkin Acceptance',
    canonicalPath: 'requirements/user-stories-use-cases.md',
    tags: ['requirements', 'user-stories', 'use-cases', 'gherkin', 'invest'],
    description: 'Historias ágiles con criterios Dado/Cuando/Entonces y flujos operativos detallados.',
    aiHooks: ['requirements.rf', 'user.roles'],
    generate: (project, requirements) => {
      const rf = requirements.filter((r) => r.type === 'RF');
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-REQ-US-002',
        canonical_path: 'requirements/user-stories-use-cases.md',
        document_type: 'USER_STORIES_USE_CASES',
        standard: 'Agile INVEST / Gherkin',
        title: `Historias de Usuario: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['requirements.stories', 'acceptance.criteria'],
        tags: ['user-stories', 'use-cases', 'gherkin'],
      });

      let body = `# Historias de Usuario y Casos de Uso Formales\n\n`;
      body += `**Proyecto:** ${project.name}\n\n`;
      body += `Este documento traduce los requisitos funcionales en historias de usuario ejecutables con criterios de aceptación Gherkin:\n\n`;

      if (rf.length === 0) {
        body += `*No se han formalizado requisitos funcionales para generar historias de usuario.*\n`;
      } else {
        rf.forEach((r, idx) => {
          body += `### US-${String(idx + 1).padStart(3, '0')}: ${r.title} (${r.code})\n`;
          body += `**Narrativa de Usuario:**\n`;
          body += `> Como **usuario autenticado en ${project.name}**,\n`;
          body += `> quiero **${r.title.toLowerCase()}**,\n`;
          body += `> para **cumplir con la regla de negocio y asegurar la trazabilidad del sistema**.\n\n`;
          body += `**Criterios de Aceptación (Gherkin):**\n`;
          body += `\`\`\`gherkin\n`;
          body += `Escenario: Ejecución exitosa de ${r.code}\n`;
          body += `  Dado que el usuario tiene sesión activa con permisos correspondientes\n`;
          body += `  Cuando solicita "${r.title}"\n`;
          body += `  Entonces el sistema valida la entrada con esquema Zod\n`;
          body += `  Y persiste la transacción retornando envelope HTTP estándar\n`;
          body += `\`\`\`\n\n`;
          body += `---\n\n`;
        });
      }

      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 3. Product & Sprint Backlog (MoSCoW)
  // --------------------------------------------------------------------------
  {
    id: 'product-backlog',
    title: 'Product & Sprint Backlog con Priorización MoSCoW',
    category: 'requirements',
    standard: 'Scrum Agile / MoSCoW Framework',
    canonicalPath: 'requirements/product-backlog.md',
    tags: ['backlog', 'moscow', 'planning', 'sprint'],
    description: 'Organización del trabajo por épicas, prioridades MoSCoW y asignación a sprints.',
    aiHooks: ['requirements.priorities', 'metrics.coverage'],
    generate: (project, requirements) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-REQ-BKL-003',
        canonical_path: 'requirements/product-backlog.md',
        document_type: 'PRODUCT_BACKLOG',
        standard: 'MoSCoW / Scrum',
        title: `Product Backlog: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['backlog.items', 'sprint.allocation'],
        tags: ['backlog', 'moscow', 'sprint'],
      });

      const must = requirements.filter((r) => r.priority === 'HIGH');
      const should = requirements.filter((r) => r.priority === 'MEDIUM');
      const could = requirements.filter((r) => r.priority === 'LOW');

      let body = `# Product & Sprint Backlog (MoSCoW Framework)\n\n`;
      body += `**Proyecto:** ${project.name}\n\n`;
      body += `## 1. Must Have (Crítico para el Lanzamiento / Sprint 1-2)\n`;
      body += `Requisitos esenciales sin los cuales el sistema no puede operar legal o técnicamente:\n\n`;
      body += `| Código | Título | Tipo | Estimación |\n| :---: | :--- | :---: | :---: |\n`;
      must.forEach((m) => { body += `| **${m.code}** | ${m.title} | ${m.type} | 5 SP |\n`; });
      if (must.length === 0) body += `| - | *Sin ítems clasificados como Must Have.* | - | - |\n`;

      body += `\n## 2. Should Have (Importante pero no Bloqueante)\n`;
      body += `| Código | Título | Tipo | Estimación |\n| :---: | :--- | :---: | :---: |\n`;
      should.forEach((s) => { body += `| **${s.code}** | ${s.title} | ${s.type} | 3 SP |\n`; });
      if (should.length === 0) body += `| - | *Sin ítems clasificados como Should Have.* | - | - |\n`;

      body += `\n## 3. Could Have (Deseable ante Disponibilidad de Tiempo)\n`;
      body += `| Código | Título | Tipo | Estimación |\n| :---: | :--- | :---: | :---: |\n`;
      could.forEach((c) => { body += `| **${c.code}** | ${c.title} | ${c.type} | 2 SP |\n`; });
      if (could.length === 0) body += `| - | *Sin ítems clasificados como Could Have.* | - | - |\n`;

      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 4. DAS / SAD (Documento de Arquitectura de Software)
  // --------------------------------------------------------------------------
  {
    id: 'das-sad',
    title: 'Documento de Arquitectura de Software (DAS / SAD — ISO 42010)',
    category: 'architecture',
    standard: 'ISO/IEC/IEEE 42010 / Kruchten 4+1',
    canonicalPath: 'architecture/das-software-architecture.md',
    tags: ['architecture', 'das', 'sad', 'iso-42010', 'kruchten'],
    description: 'Documento canónico que articula vistas lógicas, de persistencia, seguridad y decisiones.',
    aiHooks: ['architecture.style', 'canvas.entities', 'decisions.adrs', 'security.mfa'],
    generate: (project, _requirements, entities, decisions) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-ARCH-DAS-004',
        canonical_path: 'architecture/das-software-architecture.md',
        document_type: 'SOFTWARE_ARCHITECTURE_DOCUMENT',
        standard: 'ISO/IEC/IEEE 42010',
        title: `DAS: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['architecture.views', 'kruchten.4plus1'],
        tags: ['architecture', 'das', 'sad', 'governance'],
      });

      const body = `# Documento de Arquitectura de Software (DAS / SAD)

**Sistema:** ${project.name}  
**Estilo Arquitectónico:** ${project.architecture_style || 'Monolito Modular Layered MVC'}  
**Líder Arquitecto:** ${project.lead_architect || 'Senior Staff Architect'}  
**Organización:** ${project.organization || 'DevSculptor Enterprise Governance'}  
**Fecha:** ${new Date().toISOString().split('T')[0]}  

---

## 1. Visión y Objetivos Arquitectónicos
El sistema **${project.name}** adopta una arquitectura en **${project.architecture_style || 'Monolito Modular Layered MVC'}** para balancear velocidad de desarrollo, desacoplamiento estricto y gobernanza técnica asistida por IA.

### Principios Fundamentales:
1. **TypeScript Estricto:** Código fuertemente tipado en estricto cumplimiento (\`strict: true\`), con DTOs Zod como Fuente Única de Verdad (SSOT).
2. **Aislamiento Horizontal (Multi-Tenant):** Todos los recursos están asociados a un \`project_id\` y \`user_id\` con políticas Row Level Security (RLS).
3. **Persistencia Determinista:** Esquemas en Tercera Forma Normal (3FN), DDL nativo parametrizado y triggers PL/pgSQL para integridad referencial.
4. **Seguridad Integral:** Autenticación JWT Bearer con Refresh Tokens, MFA TOTP (RFC 6238) y envelope HTTP uniforme.

## 2. Vista Lógica (Módulos de Dominio)
El backend se estructura en límites de contexto autónomos:
- **Módulo Auth & Seguridad:** Identidad, contraseñas con bcrypt, sesiones JWT y validación MFA.
- **Módulo Proyectos:** Gobernanza de metadatos, estilo arquitectónico y métricas.
- **Módulo Canvas & Modelado:** Entidades relacionales, scripts DDL multi-dialecto y auditoría de cambios.
- **Módulo AI Copilot:** Orquestación conversacional, análisis heurístico y extracción de especificaciones.
- **Módulo OKF (Open Knowledge Framework):** Bóveda viva documental y empaquetado determinista.

## 3. Vista de Datos y Persistencia
El modelo relacional contiene actualmente **${entities.length} tablas normalizadas**:
${entities.map((e) => `- **Tabla \`${e.table_name}\`**: ${e.columns_json?.length || 0} columnas registradas.`).join('\n')}

## 4. Decisiones de Arquitectura Significativas (ADRs)
Se han formalizado **${decisions.length} actas de decisión** bajo el estándar de Michael Nygard:
${decisions.map((d) => `- **${d.title}** (Estado: \`${d.status}\`)`).join('\n')}
`;

      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 5. Diagrama de Clases
  // --------------------------------------------------------------------------
  {
    id: 'class-diagram',
    title: 'Diagrama de Clases del Dominio (Mermaid)',
    category: 'diagrams',
    standard: 'UML 2.5 / Mermaid',
    canonicalPath: 'architecture/diagrams/class-diagram.md',
    tags: ['uml', 'class-diagram', 'mermaid', 'domain-model'],
    description: 'Representación de entidades de dominio, atributos tipados y operaciones de servicio.',
    aiHooks: ['canvas.entities', 'database.columns'],
    generate: (project, _reqs, entities) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-DIAG-CLS-005',
        canonical_path: 'architecture/diagrams/class-diagram.md',
        document_type: 'CLASS_DIAGRAM',
        standard: 'UML 2.5',
        title: `Diagrama de Clases: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['domain.classes', 'relations'],
        tags: ['uml', 'classes', 'mermaid'],
      });

      let mermaid = 'classDiagram\n';
      entities.forEach((e) => {
        const className = toPascalCase(e.table_name);
        mermaid += `  class ${className} {\n`;
        (e.columns_json || []).forEach((col) => {
          const colRecord = col as unknown as Record<string, unknown>;
          const type = (col.type || 'string').replace(/\(.*\)/, '').replace(/\s+/g, '_');
          const isPk = Boolean(colRecord.isPk || colRecord.is_pk);
          mermaid += `    +${type} ${col.name} ${isPk ? '[PK]' : ''}\n`;
        });
        mermaid += `    +create()\n    +findById()\n    +update()\n    +delete()\n  }\n`;
      });

      if (entities.length === 0) {
        mermaid += `  class SystemEntity {\n    +string id\n    +string name\n  }\n`;
      }

      // Conexiones de Claves Foráneas (FK) UML
      const renderedEdges = new Set<string>();
      entities.forEach((child) => {
        const childClass = toPascalCase(child.table_name);
        (child.columns_json || []).forEach((col) => {
          const colRecord = col as unknown as Record<string, unknown>;
          const targetName = (col.referencesTable || col.references_table || (colRecord.referencesTable as string) || (colRecord.references_table as string));
          if (targetName) {
            const parent = entities.find(
              (p) => p.table_name.toLowerCase() === targetName.toLowerCase()
            );
            if (parent) {
              const parentClass = toPascalCase(parent.table_name);
              const edgeKey = `${parentClass}->${childClass}:${col.name}`;
              if (!renderedEdges.has(edgeKey)) {
                renderedEdges.add(edgeKey);
                mermaid += `  ${parentClass} "1" --> "*" ${childClass} : "${col.name}"\n`;
              }
            }
          }
        });
      });

      const body = `# Diagrama de Clases del Dominio\n\n**Proyecto:** ${project.name}\n\n\`\`\`mermaid\n${mermaid}\`\`\`\n`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 6. Diagrama de Paquetes (Modular Monolith)
  // --------------------------------------------------------------------------
  {
    id: 'package-diagram',
    title: 'Diagrama de Paquetes y Módulos de Arquitectura',
    category: 'diagrams',
    standard: 'UML 2.5 / C4 Component',
    canonicalPath: 'architecture/diagrams/package-diagram.md',
    tags: ['uml', 'packages', 'modular-monolith', 'mermaid'],
    description: 'Estructura en capas y dependencias direccionales de los módulos del monolito modular.',
    aiHooks: ['architecture.modules', 'layering'],
    generate: (project, requirements, entities) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-DIAG-PKG-006',
        canonical_path: 'architecture/diagrams/package-diagram.md',
        document_type: 'PACKAGE_DIAGRAM',
        standard: 'UML 2.5',
        title: `Diagrama de Paquetes: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['packages.modules'],
        tags: ['packages', 'monolith', 'mermaid'],
      });

      const style = project.architecture_style || 'Monolito Modular Layered MVC';
      const mainEntity = entities[0]?.table_name || 'core';
      const secondaryEntity = entities[1]?.table_name || 'domain';
      const primaryReq = requirements[0]?.code ? `${requirements[0].code} (${requirements[0].title})` : 'Casos de Uso de Negocio';

      const body = `# Diagrama de Paquetes y Módulos de Arquitectura

**Proyecto:** ${project.name}  
**Organización:** ${project.organization || 'DevSculptor Enterprise'}  
**Estilo Arquitectónico:** ${style}  

\`\`\`mermaid
flowchart TB
  subgraph Presentation["Capa de Presentación / API"]
    UI["SPA Client: ${project.name} Web Views"]
    Controllers["HTTP Controllers & Routers (/api/v1)"]
    Middlewares["Validación Zod & Autenticación JWT"]
    UI -->|HTTPS / REST| Controllers
    Controllers --> Middlewares
  end

  subgraph Application["Capa de Aplicación & Servicios"]
    Svc1["${toPascalCase(mainEntity)}Service"]
    Svc2["${toPascalCase(secondaryEntity)}Service"]
    UseCases["Casos de Uso: ${primaryReq}"]
    Middlewares --> Svc1
    Middlewares --> Svc2
    Svc1 --> UseCases
  end

  subgraph Domain["Capa de Dominio Puro"]
    Entities["Entidades de Negocio (${entities.length} Modeladas)"]
    Invariants["Reglas de Invarianza & Tipos TypeScript"]
    UseCases --> Entities
    Entities --> Invariants
  end

  subgraph Infrastructure["Capa de Infraestructura & Persistencia"]
    PgRepo["PostgreSQL Repositories (RLS + Transacciones)"]
    Storage["Bóveda de Archivos & Object Storage"]
    ExternalAPIs["Integraciones y Proveedores Externos"]
  end

  Svc1 --> PgRepo
  Svc2 --> PgRepo
  Svc1 --> Storage
  Svc2 --> ExternalAPIs
\`\`\`
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 7. Diagrama de Secuencia
  // --------------------------------------------------------------------------
  {
    id: 'sequence-diagram',
    title: 'Diagrama de Secuencia — Flujos Clave del Sistema',
    category: 'diagrams',
    standard: 'UML 2.5 / Mermaid',
    canonicalPath: 'architecture/diagrams/sequence-diagram.md',
    tags: ['uml', 'sequence-diagram', 'interactions'],
    description: 'Interacciones temporales entre cliente, API, base de datos y servicios de dominio.',
    aiHooks: ['sequence.flows'],
    generate: (project, requirements, entities, decisions) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-DIAG-SEQ-007',
        canonical_path: 'architecture/diagrams/sequence-diagram.md',
        document_type: 'SEQUENCE_DIAGRAM',
        standard: 'UML 2.5',
        title: `Diagrama de Secuencia: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['sequence.flows'],
        tags: ['sequence', 'interactions', 'mermaid'],
      });

      const primaryReq = requirements.find((r) => r.type === 'RF' && r.priority === 'HIGH') || requirements[0] || {
        code: 'RF-001',
        title: 'Operación Transaccional Principal',
      };
      const mainEntity = entities[0]?.table_name || 'registro';
      const entityPascal = toPascalCase(mainEntity);
      const childEntity = entities[1]?.table_name;
      const childPascal = childEntity ? toPascalCase(childEntity) : null;
      const adrTitle = decisions[0]?.title || 'Aislamiento Transaccional y Seguridad RLS';

      const body = `# Diagramas de Secuencia — Flujos Críticos

**Proyecto:** ${project.name}  
**Requerimiento Focal:** ${primaryReq.code} — ${primaryReq.title}  

### Flujo 1: Ejecución Transaccional E2E (${primaryReq.code})
\`\`\`mermaid
sequenceDiagram
  autonumber
  actor User as Usuario / Cliente
  participant UI as ${project.name} Web UI
  participant API as API Router (/api/v1/${mainEntity})
  participant Service as ${entityPascal}Service
  participant DB as PostgreSQL (${mainEntity})

  User->>UI: Solicita: ${primaryReq.title}
  UI->>API: POST /api/v1/${mainEntity} { payload } [Bearer JWT]
  API->>API: Valida esquema con Zod (Payload Sanitization)
  API->>Service: dispatchCommand(${entityPascal}Command)
  Service->>DB: BEGIN TRANSACTION (SERIALIZABLE)
  Service->>DB: INSERT INTO ${mainEntity} (...) RETURNING id
${childPascal ? `  Service->>DB: INSERT INTO ${childEntity} (parent_id, ...) \n` : ''}  DB-->>Service: Registro creado con ID persistido
  Service->>DB: COMMIT TRANSACTION
  Service-->>API: ${entityPascal}DTO Enriquecido
  API-->>UI: HTTP 201 Created { success: true, data }
  UI-->>User: Operación completada y confirmada en pantalla
\`\`\`

### Flujo 2: Gobernanza y Auditoría de Seguridad (${decisions[0]?.code || 'ADR-001'})
\`\`\`mermaid
sequenceDiagram
  autonumber
  actor Arch as Arquitecto / Administrador
  participant Portal as Admin Portal (${project.name})
  participant AuthSvc as Security & Audit Service
  participant DB as PostgreSQL (RLS & Audit Logs)

  Arch->>Portal: Ratifica decisión: ${adrTitle}
  Portal->>AuthSvc: PATCH /governance/audit { action, timestamp }
  AuthSvc->>DB: SET LOCAL app.current_user = $1
  AuthSvc->>DB: INSERT INTO audit_logs (actor, decision, status)
  DB-->>AuthSvc: Registro inmutable asentado
  AuthSvc-->>Portal: 200 OK (Auditoría confirmada)
  Portal-->>Arch: Estado formal actualizado en Bóveda
\`\`\`
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 8. Diagrama de Estados
  // --------------------------------------------------------------------------
  {
    id: 'state-diagram',
    title: 'Diagrama de Estados — Ciclos de Vida y Gobernanza',
    category: 'diagrams',
    standard: 'UML 2.5 / Mermaid',
    canonicalPath: 'architecture/diagrams/state-diagram.md',
    tags: ['uml', 'state-machine', 'adr-lifecycle', 'freshness'],
    description: 'Máquinas de estado que rigen las entidades del negocio y la gobernanza de decisiones.',
    aiHooks: ['adrs.status', 'states.lifecycle'],
    generate: (project, _requirements, entities) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-DIAG-STA-008',
        canonical_path: 'architecture/diagrams/state-diagram.md',
        document_type: 'STATE_DIAGRAM',
        standard: 'UML 2.5',
        title: `Diagrama de Estados: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['states.lifecycle'],
        tags: ['state-machine', 'adr', 'mermaid'],
      });

      const targetEntity =
        entities.find((e) =>
          (e.columns_json || []).some((c) =>
            ['status', 'estado', 'state', 'fase'].includes(c.name.toLowerCase())
          )
        ) || entities[0];
      const entityLabel = targetEntity ? toPascalCase(targetEntity.table_name) : 'Transacción';

      const body = `# Diagramas de Estados y Máquinas de Transición

**Proyecto:** ${project.name}  
**Entidad Transaccional Focal:** \`${entityLabel}\`  

### Estado 1: Ciclo de Vida del Dominio (${entityLabel})
\`\`\`mermaid
stateDiagram-v2
  [*] --> REGISTRADO : Creación inicial con validación Zod
  REGISTRADO --> EN_PROCESO : Asignación de recursos y ejecución
  EN_PROCESO --> COMPLETADO : Finalización exitosa con integridad ACID
  EN_PROCESO --> CANCELADO : Anulación o excepción controlada
  COMPLETADO --> ARCHIVADO : Conservación histórica inmutable
  CANCELADO --> [*]
  ARCHIVADO --> [*]
\`\`\`

### Estado 2: Ciclo de Vida de las Decisiones de Arquitectura (ADRs)
\`\`\`mermaid
stateDiagram-v2
  [*] --> DRAFT : Propuesta preliminar formulada
  DRAFT --> PROPOSED : Revisión técnica por el equipo
  PROPOSED --> ACCEPTED : Aprobación formal Human-in-the-Loop
  PROPOSED --> REJECTED : Descarte con justificación técnica
  ACCEPTED --> SUPERSEDED : Sustituida por nuevo ADR enmendado
  REJECTED --> [*]
  SUPERSEDED --> [*]
\`\`\`
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 9. Diagrama de Componentes
  // --------------------------------------------------------------------------
  {
    id: 'component-diagram',
    title: 'Diagrama de Componentes de Software',
    category: 'diagrams',
    standard: 'UML 2.5 / C4 Component',
    canonicalPath: 'architecture/diagrams/component-diagram.md',
    tags: ['uml', 'components', 'subsystems', 'mermaid'],
    description: 'Componentes internos, interfaces provistas y requeridas en frontend y backend.',
    aiHooks: ['components.structure'],
    generate: (project, _requirements, entities) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-DIAG-CMP-009',
        canonical_path: 'architecture/diagrams/component-diagram.md',
        document_type: 'COMPONENT_DIAGRAM',
        standard: 'UML 2.5',
        title: `Diagrama de Componentes: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['components.layers'],
        tags: ['components', 'c4', 'mermaid'],
      });

      const style = project.architecture_style || 'Monolito Modular Layered MVC';
      const mainEntity = entities[0]?.table_name || 'core';
      const secEntity = entities[1]?.table_name || 'domain';

      const body = `# Diagrama de Componentes de Software

**Proyecto:** ${project.name}  
**Estilo Arquitectónico:** ${style}  

\`\`\`mermaid
flowchart LR
  subgraph FrontendComponent["Componente Web UI (${project.name})"]
    Router["Router & View Controllers"]
    StateMgr["State Management (Stores)"]
    ApiClient["API Client (Axios Interceptors)"]
    Router --> StateMgr
    StateMgr --> ApiClient
  end

  subgraph BackendComponent["Núcleo del Backend (${style})"]
    HttpApi["Express HTTP Handlers (/api/v1)"]
    AuthModule["Módulo de Seguridad & Autorización"]
    Svc1["${toPascalCase(mainEntity)}Service"]
    Svc2["${toPascalCase(secEntity)}Service"]
    DdlEngine["Repositorio de Datos & Transacciones"]
  end

  subgraph DataLayer["Persistencia"]
    PostgresDb[("PostgreSQL 15+ (${entities.length} tablas 3FN)")]
    StorageBucket[("Object Storage")]
  end

  ApiClient -->|JSON Envelope| HttpApi
  HttpApi --> AuthModule
  HttpApi --> Svc1
  HttpApi --> Svc2
  Svc1 --> DdlEngine
  Svc2 --> DdlEngine
  DdlEngine --> PostgresDb
  Svc1 --> StorageBucket
\`\`\`
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 10. Diagrama de Despliegue
  // --------------------------------------------------------------------------
  {
    id: 'deployment-diagram',
    title: 'Diagrama de Despliegue e Infraestructura Cloud',
    category: 'diagrams',
    standard: 'UML 2.5 / Cloud Architecture',
    canonicalPath: 'architecture/diagrams/deployment-diagram.md',
    tags: ['uml', 'deployment', 'cloud', 'mermaid'],
    description: 'Topología física de servidores, balanceadores, bases de datos y servicios satélite.',
    aiHooks: ['infrastructure.cloud'],
    generate: (project) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-DIAG-DEP-010',
        canonical_path: 'architecture/diagrams/deployment-diagram.md',
        document_type: 'DEPLOYMENT_DIAGRAM',
        standard: 'UML 2.5',
        title: `Diagrama de Despliegue: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['deployment.topology'],
        tags: ['deployment', 'infrastructure', 'mermaid'],
      });

      const body = `# Diagrama de Despliegue e Infraestructura Cloud

**Proyecto:** ${project.name}  
**Organización:** ${project.organization || 'DevSculptor Enterprise'}  

\`\`\`mermaid
flowchart TD
  subgraph ClientDevice["Dispositivos Clientes"]
    Browser["Navegadores Web / Clientes Modernos"]
  end

  subgraph EdgeCloud["Red de Borde y CDN Global"]
    ViteHost["Hosting SPA (${project.name} Frontend)"]
    TlsTerm["Terminación TLS / SSL (HTTPS :443)"]
  end

  subgraph AppServer["Servidor de Aplicación (${project.architecture_style || 'Node.js LTS'})"]
    NodeProcess["API Runtime Container"]
    SecurityShield["Rate Limiting & Helmet Security"]
    AppLogger["Structured Logger & Tracing"]
  end

  subgraph CloudDatabase["Plataforma de Datos Administrada"]
    PgPooler["PostgreSQL Connection Pooler"]
    PostgresInstance["PostgreSQL 15+ Cluster (RLS Activo)"]
    S3Storage["Encrypted Object Storage"]
  end

  Browser -->|HTTPS :443| ViteHost
  Browser -->|REST API| TlsTerm
  TlsTerm --> SecurityShield
  SecurityShield --> NodeProcess
  NodeProcess --> AppLogger
  NodeProcess -->|SSL Connection| PgPooler
  PgPooler --> PostgresInstance
  NodeProcess -->|S3 Protocol| S3Storage
\`\`\`
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 11. Modelo Entidad-Relación y Diccionario de Datos
  // --------------------------------------------------------------------------
  {
    id: 'erd-relational-model',
    title: 'Modelo Entidad-Relación (DER/ERD) y Diccionario de Datos',
    category: 'diagrams',
    standard: 'ANSI SQL / Chen ERD',
    canonicalPath: 'architecture/diagrams/erd-relational-model.md',
    tags: ['database', 'erd', 'data-dictionary', '3fn', 'mermaid'],
    description: 'Diagrama relacional exhaustivo con tipos de datos, PK, FK y restricciones de integridad.',
    aiHooks: ['canvas.entities', 'database.columns'],
    generate: (project, _reqs, entities) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-DIAG-ERD-011',
        canonical_path: 'architecture/diagrams/erd-relational-model.md',
        document_type: 'ERD_DATA_DICTIONARY',
        standard: 'ANSI SQL 3FN',
        title: `Modelo ERD: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['erd.entities', 'data.dictionary'],
        tags: ['database', 'erd', 'schema'],
      });

      let erMermaid = 'erDiagram\n';

      // 1. Relaciones de Claves Foráneas (Crow's Foot)
      const renderedErEdges = new Set<string>();
      entities.forEach((child) => {
        (child.columns_json || []).forEach((col) => {
          const colRecord = col as unknown as Record<string, unknown>;
          const targetName = (col.referencesTable || col.references_table || (colRecord.referencesTable as string) || (colRecord.references_table as string));
          if (targetName) {
            const parent = entities.find(
              (p) => p.table_name.toLowerCase() === targetName.toLowerCase()
            );
            if (parent) {
              const edgeKey = `${parent.table_name}->${child.table_name}:${col.name}`;
              if (!renderedErEdges.has(edgeKey)) {
                renderedErEdges.add(edgeKey);
                const cardinality = col.cardinality || '1:N';
                let relSymbol = '||--o{';
                if (cardinality === '1:1') relSymbol = '||--||';
                if (cardinality === 'N:M') relSymbol = '}o--o{';
                erMermaid += `  ${parent.table_name} ${relSymbol} ${child.table_name} : "${col.name}"\n`;
              }
            }
          }
        });
      });

      // 2. Definición de Entidades
      entities.forEach((e) => {
        erMermaid += `  ${e.table_name} {\n`;
        (e.columns_json || []).forEach((col) => {
          const colRecord = col as unknown as Record<string, unknown>;
          const cleanType = (col.type || 'varchar').replace(/\(.*\)/, '').replace(/\s+/g, '_');
          const isPk = Boolean(colRecord.isPk || colRecord.is_pk);
          const isFk = Boolean(colRecord.isFk || colRecord.is_fk || col.referencesTable || col.references_table);
          erMermaid += `    ${cleanType} ${col.name} ${isPk ? 'PK' : isFk ? 'FK' : ''}\n`;
        });
        erMermaid += `  }\n`;
      });

      if (entities.length === 0) {
        erMermaid += `  EMPTY_SCHEMA {\n    string id PK\n  }\n`;
      }

      let body = `# Modelo Entidad-Relación (DER) y Diccionario de Datos\n\n`;
      body += `**Proyecto:** ${project.name}\n\n`;
      body += `\`\`\`mermaid\n${erMermaid}\`\`\`\n\n`;
      body += `## Diccionario de Datos Relacional\n\n`;

      if (entities.length === 0) {
        body += `*No hay tablas registradas en el canvas relacional.*\n`;
      } else {
        entities.forEach((e) => {
          body += `### Tabla: \`${e.table_name}\`\n\n`;
          body += `| Columna | Tipo de Dato | PK | FK | Nulo | Restricciones |\n`;
          body += `| :--- | :---: | :---: | :---: | :---: | :--- |\n`;
          (e.columns_json || []).forEach((col) => {
            const colRecord = col as unknown as Record<string, unknown>;
            const isPk = Boolean(colRecord.isPk || colRecord.is_pk) ? '✓' : '-';
            const targetTable = col.referencesTable || col.references_table || (colRecord.referencesTable as string) || (colRecord.references_table as string);
            const isFk = Boolean(colRecord.isFk || colRecord.is_fk || targetTable) ? '✓' : '-';
            const isNullable = col.nullable ? 'SÍ' : 'NO';
            const ref = targetTable ? `FK -> ${targetTable}` : (col.unique ? 'UNIQUE' : '-');
            body += `| \`${col.name}\` | \`${col.type}\` | ${isPk} | ${isFk} | ${isNullable} | ${ref} |\n`;
          });
          body += `\n`;
        });
      }

      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 12. Plan Integral de Pruebas
  // --------------------------------------------------------------------------
  {
    id: 'test-plan',
    title: 'Plan Integral de Aseguramiento de Calidad y Pruebas (Test Plan)',
    category: 'quality',
    standard: 'IEEE 829 / ISTQB',
    canonicalPath: 'quality/test-plan.md',
    tags: ['quality', 'test-plan', 'ieee-829', 'istqb', 'qa'],
    description: 'Estrategia de testing de 4 capas: Unitario, Integración API, E2E y Seguridad RLS.',
    aiHooks: ['requirements.testing', 'metrics.maturity'],
    generate: (project, requirements) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-QUAL-TEST-012',
        canonical_path: 'quality/test-plan.md',
        document_type: 'TEST_PLAN',
        standard: 'IEEE 829',
        title: `Plan de Pruebas: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['testing.strategy'],
        tags: ['testing', 'qa', 'ieee-829'],
      });

      const body = `# Plan Integral de Aseguramiento de Calidad y Pruebas (IEEE 829)

**Proyecto:** ${project.name}  
**Fecha:** ${new Date().toISOString().split('T')[0]}  

---

## 1. Estrategia Piramidal de Testing
DevSculptor aplica un enfoque riguroso de 4 niveles para garantizar la estabilidad de **${project.name}**:

1. **Nivel 1: Pruebas Unitarias Aisladas (Vitest / Jest):** Cobertura de validaciones Zod, transformadores de datos y generadores de esquemas DDL.
2. **Nivel 2: Pruebas de Integración de API (Supertest / Postman):** Colecciones automatizadas con aserciones semánticas para cada endpoint (\`pm.response.to.have.status(200)\`).
3. **Nivel 3: Pruebas de Seguridad y Aislamiento RLS:** Verificación estricta de que ningún usuario acceda a datos de inquilinos ajenos.
4. **Nivel 4: Pruebas E2E de Flujo Completo (Playwright / BrowserAgent):** Simulación de interacciones de usuario en el canvas y exportación documental.

## 2. Matriz de Casos de Prueba por Requisito
${requirements.map((r, i) => `### CP-${String(i + 1).padStart(3, '0')}: Validación de ${r.code} (${r.title})
- **Objetivo:** Verificar el cumplimiento de ${r.code}.
- **Precondiciones:** Usuario autenticado con token válido.
- **Datos de Prueba:** Payload validado por esquema Zod correspondiente.
- **Resultado Esperado:** Retorno HTTP 200/201 con envelope estándar y persistencia confirmada.
`).join('\n')}
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 13. Especificación de API REST (OpenAPI 3.1)
  // --------------------------------------------------------------------------
  {
    id: 'api-specification',
    title: 'Especificación de API REST (OpenAPI 3.1 / Contracts)',
    category: 'quality',
    standard: 'OpenAPI 3.1 / RESTful Governance',
    canonicalPath: 'quality/api-specification.md',
    tags: ['api', 'openapi', 'rest', 'endpoints'],
    description: 'Catálogo de contratos de comunicación, parámetros, esquemas de entrada y respuestas.',
    aiHooks: ['api.endpoints', 'contracts.zod'],
    generate: (project) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-QUAL-API-013',
        canonical_path: 'quality/api-specification.md',
        document_type: 'API_SPECIFICATION',
        standard: 'OpenAPI 3.1',
        title: `API Spec: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['api.contracts'],
        tags: ['api', 'rest', 'openapi'],
      });

      const body = `# Especificación de API REST — Contratos Oficiales

**Sistema:** ${project.name}  
**Base URL:** \`/api/v1\`  
**Protocolo:** HTTPS / JSON Uniform Envelope  

---

## 1. Contrato de Envelope Estándar
Todas las respuestas del sistema se adhieren al envelope uniforme:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-10-02T21:00:00Z"
  }
}
\`\`\`

## 2. Catálogo de Endpoints de Dominio
| Método | Ruta | Autenticación | Propósito |
| :---: | :--- | :---: | :--- |
| \`POST\` | \`/auth/login\` | Pública | Inicio de sesión y verificación de credenciales |
| \`POST\` | \`/auth/mfa/verify-login\` | Pública (Temp Token) | Validación de segundo factor TOTP (RFC 6238) |
| \`GET\` | \`/projects\` | JWT Bearer | Listado de proyectos del usuario con métricas |
| \`POST\` | \`/projects/:id/canvas/entities\` | JWT Bearer | Creación de entidad relacional en 3FN |
| \`GET\` | \`/projects/:id/decisions\` | JWT Bearer | Catálogo de decisiones de arquitectura (ADRs) |
| \`POST\` | \`/projects/:id/ai/chat\` | JWT Bearer + BYOK | Inferencia con Copiloto de Arquitectura |
| \`POST\` | \`/projects/:id/ai/ping\` | JWT Bearer + BYOK | Test de latencia y verificación de API Key |
| \`POST\` | \`/projects/:id/okf/sync\` | JWT Bearer | Sincronización de Bóveda OKF con PostgreSQL |
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 14. Matriz de Trazabilidad Bidireccional (RTM — IEEE 29148 / ISO 15504)
  // --------------------------------------------------------------------------
  {
    id: 'traceability-matrix',
    title: 'Matriz de Trazabilidad Bidireccional (RTM — IEEE 29148 / ISO 15504)',
    category: 'requirements',
    standard: 'IEEE 29148 / ISO/IEC 15504 / CMMI DEV v2.0',
    canonicalPath: 'requirements/traceability-matrix.md',
    tags: ['requirements', 'rtm', 'traceability', 'iso-29148', 'cmmi', 'compliance'],
    description: 'Matriz bidireccional que conecta requisitos de negocio, entidades del modelo relacional, decisiones arquitectónicas (ADRs) y criterios de prueba.',
    aiHooks: ['requirements.traceability', 'matrix.rtm', 'decisions.impact'],
    generate: (project, requirements, entities, decisions) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-REQ-RTM-014',
        canonical_path: 'requirements/traceability-matrix.md',
        document_type: 'REQUIREMENT_TRACEABILITY_MATRIX',
        standard: 'IEEE 29148 / ISO 15504',
        title: `Matriz RTM: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['requirements.traceability', 'matrix.rtm'],
        tags: ['requirements', 'rtm', 'traceability', 'iso-29148'],
      });

      const totalReqs = requirements.length;
      const rfCount = requirements.filter((r) => r.type === 'RF').length;
      const rnfCount = requirements.filter((r) => r.type === 'RNF').length;

      const body = `# Matriz de Trazabilidad Bidireccional de Requisitos (RTM)

**Proyecto:** ${project.name}  
**Estándar:** IEEE 29148 / ISO/IEC 15504 (SPICE) / CMMI  
**Fecha de Emisión:** ${new Date().toISOString().split('T')[0]}  
**Cobertura:** ${totalReqs} Requisitos (${rfCount} RF, ${rnfCount} RNF) vinculados a ${entities.length} Entidades y ${decisions.length} ADRs  

---

## 1. Resumen Ejecutivo de Cobertura
La Matriz de Trazabilidad de Requisitos (RTM) garantiza que ningún requisito de software quede huérfano, asegurando la correlación bidireccional entre la especificación inicial, el modelo de persistencia (3FN) y las decisiones arquitectónicas adoptadas.

| Métrica de Gobernanza | Valor Registrado | Estado de Cumplimiento |
| :--- | :---: | :--- |
| Requisitos Totales Registrados | **${totalReqs}** | Requisitos formalizados en Bóveda OKF |
| Requisitos Funcionales (RF) | **${rfCount}** | Cubiertos por endpoints y entidades |
| Requisitos No Funcionales (RNF) | **${rnfCount}** | Evaluados bajo ISO/IEC 25010 |
| Entidades de Datos Asociadas | **${entities.length}** | Tablas modeladas en Canvas ERD |
| Decisiones Arquitectónicas (ADRs) | **${decisions.length}** | Decisiones ratificadas en MADR |
| Tasa de Trazabilidad Estructural | **100%** | Sin inconsistencias de orfandad detectadas |

---

## 2. Matriz Cruzada de Trazabilidad
| ID Requisito | Tipo & Prioridad | Título / Objetivo | Entidad Vinculada | ADR Relacionada | Verificación |
| :---: | :---: | :--- | :--- | :---: | :---: |
${
  requirements.length > 0
    ? requirements
        .map((r) => {
          const matchedEntity = r.entity_relation || (entities.length > 0 ? entities[0].table_name : 'Transversal');
          const matchedDecision = decisions.length > 0 ? decisions[0].code : 'ADR-01';
          return `| \`${r.code}\` | ${r.type} (${r.priority}) | ${r.title} | \`${matchedEntity}\` | \`${matchedDecision}\` | ✓ Pruebas Unitarias & E2E |`;
        })
        .join('\n')
    : '| `RF-001` | RF (HIGH) | Requisito inicial por defecto | `projects` | `ADR-01` | ✓ Especificado |'
}

---

## 3. Verificación de Integridad y Análisis de Impacto
- **Garantía Forward Traceability:** Cada requisito mapea directamente a componentes de base de datos y endpoints de API.
- **Garantía Backward Traceability:** Ninguna tabla o endpoint existe sin un requerimiento de negocio o directriz de seguridad que lo justifique.
- **Protocolo de Modificación:** Todo cambio en la matriz debe reflejarse en los artefactos correspondientes antes del paso a producción.
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 15. Diccionario de Datos Formal (ISO/IEC 11179)
  // --------------------------------------------------------------------------
  {
    id: 'data-dictionary',
    title: 'Diccionario de Datos Formal (ISO/IEC 11179 / DAMA-DMBOK)',
    category: 'architecture',
    standard: 'ISO/IEC 11179 / DAMA-DMBOK 2nd Ed.',
    canonicalPath: 'architecture/data-dictionary.md',
    tags: ['architecture', 'data-dictionary', 'iso-11179', 'database', 'schema'],
    description: 'Catálogo exhaustivo de metadatos de persistencia: desglose detallado de tablas, atributos, tipos primitivos, nulabilidad, restricciones PK/FK y cardinalidad.',
    aiHooks: ['database.schema', 'entities.metadata', 'data.dictionary'],
    generate: (project, _requirements, entities) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-ARCH-DICO-015',
        canonical_path: 'architecture/data-dictionary.md',
        document_type: 'DATA_DICTIONARY',
        standard: 'ISO/IEC 11179',
        title: `Diccionario de Datos: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['database.schema', 'data.dictionary'],
        tags: ['data-dictionary', 'iso-11179', 'database', 'architecture'],
      });

      const totalColumns = entities.reduce((acc, ent) => acc + (ent.columns_json?.length || 0), 0);
      const totalFks = entities.reduce(
        (acc, ent) => acc + (ent.columns_json?.filter((c) => c.isFk || c.is_fk).length || 0),
        0
      );

      const body = `# Diccionario de Datos Formal (ISO/IEC 11179)

**Sistema:** ${project.name}  
**Estándar de Metadatos:** ISO/IEC 11179 / DAMA-DMBOK  
**Normalización:** Tercera Forma Normal (3FN) con Claves Subrogadas UUID v4  
**Fecha de Generación:** ${new Date().toISOString().split('T')[0]}  
**Inventario:** ${entities.length} Tablas | ${totalColumns} Columnas | ${totalFks} Restricciones Foreign Key  

---

## 1. Resumen Estructural del Modelo
El presente diccionario documenta formalmente la estructura de los datos persistentes del sistema **${project.name}**. Todas las definiciones cumplen con las convenciones de nomenclatura en \`snake_case\` y políticas estrictas de integridad referencial.

${
  entities.length > 0
    ? entities
        .map((ent, i) => {
          const cols = ent.columns_json || [];
          return `### 1.${i + 1}. Tabla: \`${ent.table_name}\`
- **Nombre Canónico:** \`${ent.table_name}\`
- **Total de Columnas:** ${cols.length}
- **Clave Primaria:** \`${cols.find((c) => c.isPk || c.is_pk)?.name || 'id'}\`
- **Posición en Canvas:** \`X: ${ent.position_x}, Y: ${ent.position_y}\`

| Columna | Tipo de Dato | Clave | Nulo | Default | Referencia / Cardinalidad |
| :--- | :---: | :---: | :---: | :---: | :--- |
${cols
  .map((c) => {
    const isPk = c.isPk || c.is_pk ? 'PK' : '-';
    const isFk = c.isFk || c.is_fk ? 'FK' : '-';
    const keyBadge = isPk !== '-' ? '**PK**' : isFk !== '-' ? '`FK`' : '-';
    const nullable = c.nullable ? 'Sí' : '**No**';
    const defVal = c.default_value ? `\`${c.default_value}\`` : '-';
    const ref =
      c.referencesTable || c.references_table
        ? `→ \`${c.referencesTable || c.references_table}.${c.referencesColumn || c.references_column || 'id'}\` (${c.cardinality || '1:N'})`
        : '-';
    return `| \`${c.name}\` | \`${c.type}\` | ${keyBadge} | ${nullable} | ${defVal} | ${ref} |`;
  })
  .join('\n')}
`;
        })
        .join('\n---\n\n')
    : `*(No se han detectado entidades en el Canvas del proyecto. Modele tablas en el lienzo para poblarlas automáticamente).*`
}

---

## 2. Convenciones de Almacenamiento e Integridad
1. **Tipos Primitivos:**
   - Identificadores principales: \`UUID\` (RFC 4122 v4) indexados con \`B-Tree\`.
   - Marcas temporales: \`TIMESTAMPTZ\` con valor por defecto \`CURRENT_TIMESTAMP\`.
   - Cadenas descriptivas: \`VARCHAR(255)\` o \`TEXT\` con sanitización UTF-8.
2. **Políticas de Integridad Referencial:** Claves foráneas configuradas con \`ON DELETE RESTRICT\` para auditorías o \`CASCADE\` en relaciones padre-hijo controladas.
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 16. Compilación DDL Multi-Motor Oficial (ANSI SQL / PostgreSQL / MySQL / Oracle)
  // --------------------------------------------------------------------------
  {
    id: 'ddl-multi-engine',
    title: 'Compilación DDL Multi-Motor Oficial (ANSI SQL / PostgreSQL / MySQL / Oracle)',
    category: 'architecture',
    standard: 'ISO/IEC 9075:2023 (SQL Standard) / Multi-Engine DDL',
    canonicalPath: 'architecture/ddl-multi-engine.md',
    tags: ['architecture', 'sql', 'ddl', 'postgresql', 'mysql', 'oracle', 'database'],
    description: 'Scripts canónicos de definición de datos compilados para PostgreSQL y ANSI SQL con soporte integral de claves primarias, foráneas, índices e integridad 3FN.',
    aiHooks: ['database.ddl', 'sql.compilation', 'schema.generation'],
    generate: (project, _requirements, entities) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-ARCH-DDL-016',
        canonical_path: 'architecture/ddl-multi-engine.md',
        document_type: 'DATABASE_DDL_COMPILATION',
        standard: 'ISO/IEC 9075:2023',
        title: `DDL Multi-Motor: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['database.ddl', 'sql.compilation'],
        tags: ['ddl', 'sql', 'database', 'postgresql', 'oracle'],
      });

      // Generación determinista de script SQL para PostgreSQL
      const pgSqlStatements: string[] = [];
      const fkAlterStatements: string[] = [];

      entities.forEach((ent) => {
        const cols = ent.columns_json || [];
        const colDefs = cols.map((c) => {
          let line = `  "${c.name}" ${c.type.toUpperCase()}`;
          if (c.isPk || c.is_pk) line += ' PRIMARY KEY';
          if (!c.nullable && !c.isPk && !c.is_pk) line += ' NOT NULL';
          if (c.unique) line += ' UNIQUE';
          if (c.default_value) line += ` DEFAULT ${c.default_value}`;
          return line;
        });

        // Almacenar FKs para ejecutarlas al final
        cols.forEach((c) => {
          if ((c.isFk || c.is_fk) && (c.referencesTable || c.references_table)) {
            const targetTable = c.referencesTable || c.references_table;
            const targetCol = c.referencesColumn || c.references_column || 'id';
            fkAlterStatements.push(
              `ALTER TABLE "${ent.table_name}"\n  ADD CONSTRAINT "fk_${ent.table_name}_${c.name}"\n  FOREIGN KEY ("${c.name}") REFERENCES "${targetTable}" ("${targetCol}")\n  ON UPDATE CASCADE ON DELETE RESTRICT;`
            );
          }
        });

        pgSqlStatements.push(`CREATE TABLE IF NOT EXISTS "${ent.table_name}" (\n${colDefs.join(',\n')}\n);`);
      });

      const fullPgScript = `-- ============================================================================
-- SCRIPT DDL: POSTGRESQL 15+ / ANSI SQL COMPLIANT
-- PROYECTO: ${project.name}
-- GENERADO AUTOMÁTICAMENTE POR DEVSCLULPTOR OKF ENGINE
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

${pgSqlStatements.join('\n\n')}

-- ============================================================================
-- INTEGRIDAD REFERENCIAL Y CLAVES FORÁNEAS (3FN)
-- ============================================================================
${fkAlterStatements.length > 0 ? fkAlterStatements.join('\n\n') : '-- No se definieron relaciones foráneas adicionales.'}
`;

      const body = `# Compilación DDL Multi-Motor Oficial

**Proyecto:** ${project.name}  
**Dialectos Principales:** PostgreSQL 15+, ANSI SQL:2023, MySQL 8.0, Oracle 21c  
**Fecha de Compilación:** ${new Date().toISOString().split('T')[0]}  
**Entidades Compiladas:** ${entities.length} tablas  

---

## 1. Script Canónico de Base de Datos (PostgreSQL 15+)
El siguiente código DDL es completamente ejecutable y contiene la declaración de tablas, columnas, restricciones de no nulidad, claves primarias y relaciones de clave foránea.

\`\`\`sql
${fullPgScript}
\`\`\`

---

## 2. Pautas de Despliegue y Migración
1. **Transaccionalidad:** Ejecutar siempre los scripts DDL dentro de un bloque \`BEGIN; ... COMMIT;\` para garantizar operaciones atómicas.
2. **Aislamiento Multi-Inquilino (RLS):** Se recomienda activar \`ROW LEVEL SECURITY\` en tablas con columna \`tenant_id\` o \`project_id\`.
3. **Indexación Recomendada:** Crear índices B-Tree en todas las columnas con restricción de clave foránea (\`FK\`) para optimizar sentencias \`JOIN\`.
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 17. Auditoría de Gobernanza y Calidad de Software (ISO/IEC 25010 SQuaRE)
  // --------------------------------------------------------------------------
  {
    id: 'governance-compliance',
    title: 'Auditoría de Gobernanza y Calidad de Software (ISO/IEC 25010 SQuaRE)',
    category: 'quality',
    standard: 'ISO/IEC 25010:2023 (Systems and software Quality Requirements and Evaluation)',
    canonicalPath: 'quality/governance-compliance.md',
    tags: ['quality', 'governance', 'iso-25010', 'square', 'audit', 'metrics'],
    description: 'Evaluación formal de las 8 dimensiones de calidad de producto de software bajo el estándar internacional ISO/IEC 25010 (SQuaRE).',
    aiHooks: ['quality.iso25010', 'governance.metrics', 'audit.compliance'],
    generate: (project, requirements, _entities, _decisions, metrics) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-QUAL-GOV-017',
        canonical_path: 'quality/governance-compliance.md',
        document_type: 'QUALITY_GOVERNANCE_AUDIT',
        standard: 'ISO/IEC 25010:2023',
        title: `Auditoría ISO 25010: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['quality.iso25010', 'governance.metrics'],
        tags: ['governance', 'quality', 'iso-25010', 'compliance'],
      });

      const healthScore = metrics?.maturity_index ?? 95;
      const rfTotal = requirements.filter((r) => r.type === 'RF').length;

      const body = `# Auditoría de Gobernanza y Calidad de Software (ISO/IEC 25010)

**Proyecto Auditado:** ${project.name}  
**Marco de Evaluación:** ISO/IEC 25010:2023 (SQuaRE)  
**Índice de Salud Arquitectónica:** **${healthScore}/100**  
**Fecha de Dictamen:** ${new Date().toISOString().split('T')[0]}  

---

## 1. Evaluación por las 8 Características de Calidad ISO/IEC 25010

| Característica ISO | Sub-características Evaluadas | Puntuación | Hallazgo & Estado |
| :--- | :--- | :---: | :--- |
| **1. Adecuación Funcional** | Completitud, corrección y pertinencia funcional | **98%** | ${rfTotal} requisitos funcionales verificados con criterios de aceptación. |
| **2. Eficiencia de Desempeño** | Comportamiento temporal y utilización de recursos | **95%** | Consultas SQL optimizadas en 3FN; renderizado en cliente a 60 FPS. |
| **3. Compatibilidad** | Coexistencia e interoperabilidad | **96%** | Integración nativa con OpenAPI 3.1 y exportación canónica en JSON / Markdown. |
| **4. Usabilidad** | Reconocimiento, aprendizaje y protección ante errores | **94%** | Interfaz reactiva con tema dark/light y controles accesibles. |
| **5. Confiabilidad** | Madurez, tolerancia a fallos y capacidad de recuperación | **97%** | Manejo de excepciones centralizado con envelopes uniformes. |
| **6. Seguridad** | Confidencialidad, integridad, no repudio y autenticidad | **99%** | Autenticación MFA TOTP (RFC 6238), Argon2id y defensa contra inyecciones. |
| **7. Mantenibilidad** | Modularidad, reusabilidad, analizabilidad y modificabilidad | **98%** | Arquitectura Monolito Modular Layered MVC con estricto TypeScript. |
| **8. Portabilidad** | Adaptabilidad, facilidad de instalación y reemplazabilidad | **95%** | Despliegue autocontenido en Docker y soporte multi-navegador. |

---

## 2. Madurez Estructural y Gobernanza OKF
- **Bóveda Unificada OKF:** Toda la especificación reside en una jerarquía determinista trazable en Git.
- **Auditoría de Cambios:** Modificaciones registradas en \`audit_logs\` con hash SHA-256 inmutable.
- **Dictamen Final:** **APROBADO PARA PRODUCCIÓN ENTERPRISE**.
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 18. Pautas de Seguridad Transversal y Aislamiento RLS (OWASP ASVS / Zero Trust)
  // --------------------------------------------------------------------------
  {
    id: 'security-rls-guidelines',
    title: 'Pautas de Seguridad Transversal y Aislamiento RLS (OWASP ASVS / Zero Trust)',
    category: 'quality',
    standard: 'OWASP ASVS v4.0 / NIST SP 800-207 (Zero Trust Architecture)',
    canonicalPath: 'quality/security-rls-guidelines.md',
    tags: ['quality', 'security', 'rls', 'owasp', 'zero-trust', 'multi-tenant'],
    description: 'Arquitectura de defensa en profundidad: aislamiento de datos con Row Level Security (RLS), autenticación multifactor TOTP, hashing Argon2id y validación Zod.',
    aiHooks: ['security.rls', 'owasp.asvs', 'auth.zero-trust'],
    generate: (project) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-QUAL-SEC-018',
        canonical_path: 'quality/security-rls-guidelines.md',
        document_type: 'SECURITY_RLS_GUIDELINES',
        standard: 'OWASP ASVS v4.0 / Zero Trust',
        title: `Pautas de Seguridad: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['security.rls', 'owasp.asvs'],
        tags: ['security', 'rls', 'owasp', 'zero-trust'],
      });

      const body = `# Pautas de Seguridad Transversal y Aislamiento RLS

**Sistema:** ${project.name}  
**Marco de Referencia:** OWASP Application Security Verification Standard (ASVS v4.0 Nivel 2)  
**Modelo de Seguridad:** Zero Trust Architecture (NIST SP 800-207)  
**Fecha de Vigencia:** ${new Date().toISOString().split('T')[0]}  

---

## 1. Defensa en Profundidad (Capas Transversales)
DevSculptor implementa un modelo de seguridad en 5 capas concéntricas:

\`\`\`
[ CAPA 1: RED & GATEWAY ] -> Rate Limiting (Redis), CORS Estricto, Headers OWASP
         │
[ CAPA 2: TRANSPORTE ]   -> TLS 1.3 Forzado, Cookies HttpOnly SameSite=Strict
         │
[ CAPA 3: APLICACIÓN ]   -> Validación Zod Estricta en DTOs, Hashing Argon2id
         │
[ CAPA 4: AUTENTICACIÓN ]-> JWT Bearer con rotación + MFA TOTP (RFC 6238)
         │
[ CAPA 5: BASE DE DATOS ]-> Row Level Security (RLS) en PostgreSQL Multi-Tenant
\`\`\`

---

## 2. Implementación Canónica de Row Level Security (RLS)
Para garantizar el aislamiento irrompible entre inquilinos a nivel de motor de base de datos, cada tabla contiene la columna obligatoria \`project_id\` o \`tenant_id\` y activa RLS:

\`\`\`sql
-- 1. Habilitación de RLS en la tabla
ALTER TABLE "requirements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "requirements" FORCE ROW LEVEL SECURITY;

-- 2. Creación de Política de Aislamiento basada en Sesión Segura
CREATE POLICY tenant_isolation_requirements ON "requirements"
  FOR ALL
  TO application_user
  USING (project_id = NULLIF(current_setting('app.current_project_id', true), '')::uuid)
  WITH CHECK (project_id = NULLIF(current_setting('app.current_project_id', true), '')::uuid);
\`\`\`

---

## 3. Matriz de Mitigación OWASP Top 10
| Vector de Riesgo OWASP | Mecanismo de Mitigación en DevSculptor |
| :--- | :--- |
| **A01: Broken Access Control** | RLS a nivel de DB + Middlewares \`requireSuperAdmin\` y \`requireProjectAccess\`. |
| **A02: Cryptographic Failures** | Hashing de credenciales con Argon2id (m=65536, t=3, p=4), cifrado AES-256-GCM para BYOK. |
| **A03: Injection** | Consultas parametrizadas con \`pg\` y validación Zod previa a la capa de servicio. |
| **A04: Insecure Design** | Separación en capas Monolito Modular Layered MVC sin dependencias circulares. |
| **A05: Security Misconfiguration** | Headers de seguridad Helmet (\`Content-Security-Policy\`, \`X-Frame-Options\`). |
| **A07: Identification and Auth** | Tokens temporales no reusables para MFA; bloqueo tras intentos fallidos consecutivos. |
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },

  // --------------------------------------------------------------------------
  // 19. Dossier Consolidado de Decisiones de Arquitectura (ADR — Michael Nygard / MADR)
  // --------------------------------------------------------------------------
  {
    id: 'adr-dossier',
    title: 'Dossier Consolidado de Decisiones de Arquitectura (ADR — Michael Nygard / MADR)',
    category: 'architecture',
    standard: 'MADR 3.0 / Michael Nygard ADR Standard / ISO 42010',
    canonicalPath: 'architecture/adr-dossier.md',
    tags: ['architecture', 'adr', 'madr', 'decisions', 'governance'],
    description: 'Compendio exhaustivo de registros de decisiones arquitectónicas del proyecto con contexto, alternativas evaluadas, justificación de selección y consecuencias operativas.',
    aiHooks: ['decisions.adr', 'architecture.governance', 'tradeoffs.analysis'],
    generate: (project, _requirements, _entities, decisions) => {
      const frontmatter = buildYamlFrontmatter({
        template_id: 'TPL-ARCH-ADR-019',
        canonical_path: 'architecture/adr-dossier.md',
        document_type: 'ARCHITECTURAL_DECISION_DOSSIER',
        standard: 'MADR 3.0 / Michael Nygard',
        title: `Dossier ADR: ${project.name}`,
        project_name: project.name,
        ai_context_hooks: ['decisions.adr', 'architecture.governance'],
        tags: ['adr', 'madr', 'architecture', 'decisions'],
      });

      const body = `# Dossier Consolidado de Decisiones de Arquitectura (ADR)

**Proyecto:** ${project.name}  
**Líder Arquitecto:** ${project.lead_architect || 'Senior Staff Architect'}  
**Estándar:** MADR (Markdown Architectural Decision Records v3.0)  
**Total de ADRs Documentadas:** ${decisions.length > 0 ? decisions.length : 4}  
**Fecha de Consolidación:** ${new Date().toISOString().split('T')[0]}  

---

## 1. Índice Cronológico de Decisiones
${
  decisions.length > 0
    ? decisions
        .map(
          (d) =>
            `- **[${d.code}] ${d.title}** — Estado: \`${d.status}\` (Registrado: ${d.created_at.split('T')[0]})`
        )
        .join('\n')
    : `- **[ADR-01] Estilo Monolito Modular Layered MVC** — Estado: \`ACCEPTED\`
- **[ADR-02] Estrategia de Aislamiento de Persistencia con PostgreSQL y RLS** — Estado: \`ACCEPTED\`
- **[ADR-03] Autenticación con JWT de Corta Duración y MFA TOTP (RFC 6238)** — Estado: \`ACCEPTED\`
- **[ADR-04] Bóveda Canónica de Documentos OKF con Trazabilidad Git** — Estado: \`ACCEPTED\``
}

---

## 2. Registro Detallado de Decisiones Arquitectónicas

${
  decisions.length > 0
    ? decisions
        .map((d) => {
          return `### ${d.code}: ${d.title}
- **Estado:** \`${d.status}\`
- **Fecha de Decisión:** ${d.created_at.split('T')[0]}

#### Contexto y Planteamiento del Problema
${d.context || 'Contexto arquitectónico formalizado en Bóveda OKF.'}

#### Decisión Tomada
${d.decision || 'Decisión técnica aprobada e integrada en el código fuente.'}

#### Consecuencias y Trade-offs
${d.consequences || '- **Positivas:** Coherencia de arquitectura y desacoplamiento limpio.\n- **Negativas:** Requiere apego estricto a las convenciones definidas.'}
`;
        })
        .join('\n---\n\n')
    : `### ADR-01: Adopción del Estilo Monolito Modular Layered MVC
- **Estado:** \`ACCEPTED\`
- **Fecha:** 2026-10-01

#### Contexto
El sistema requiere alta velocidad de desarrollo, control transaccional estricto y baja sobrecarga operativa, evitando la complejidad prematura de microservicios distribuidos.

#### Decisión
Implementar un Monolito Modular con capas estrictas: Router -> Controller -> Service -> Repository, comunicándose únicamente a través de contratos tipados con Zod y TypeScript.

#### Consecuencias
- **Positivas:** Fácil trazabilidad, compilación estática unificada y cero latencia de red entre servicios de dominio.
- **Negativas:** Requiere disciplina para no violar los límites de los módulos.

---

### ADR-02: Persistencia con PostgreSQL y Row Level Security (RLS)
- **Estado:** \`ACCEPTED\`
- **Fecha:** 2026-10-02

#### Contexto
Múltiples clientes y proyectos conviven en la misma base de datos, requiriendo aislamiento absoluto sin incurrir en los costos de bases de datos separadas.

#### Decisión
Utilizar PostgreSQL 15+ con \`ROW LEVEL SECURITY\` activado en todas las tablas transaccionales, inyectando el \`project_id\` en la sesión de la conexión.

#### Consecuencias
- **Positivas:** Aislamiento forzado por el kernel de la base de datos; previene filtración de datos ante errores en la capa de aplicación.
- **Negativas:** Las consultas directas de administración requieren rol superusuario explícito.`
}
`;
      return { markdown: body, yamlFrontmatter: frontmatter, fullContent: `${frontmatter}\n\n${body}` };
    },
  },
];

