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
        const className = e.table_name.charAt(0).toUpperCase() + e.table_name.slice(1);
        mermaid += `  class ${className} {\n`;
        (e.columns_json || []).forEach((col) => {
          const colRecord = col as unknown as Record<string, unknown>;
          const type = (col.type || 'string').replace(/\(.*\)/, '');
          const isPk = Boolean(colRecord.isPk || colRecord.is_pk);
          mermaid += `    +${type} ${col.name} ${isPk ? '[PK]' : ''}\n`;
        });
        mermaid += `    +create()\n    +findById()\n    +update()\n    +delete()\n  }\n`;
      });

      if (entities.length === 0) {
        mermaid += `  class SystemEntity {\n    +string id\n    +string name\n  }\n`;
      }

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
    generate: (project) => {
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

      const body = `# Diagrama de Paquetes y Módulos de Arquitectura

**Proyecto:** ${project.name}

\`\`\`mermaid
flowchart TB
  subgraph Frontend["SPA React + Vite Client"]
    UI["Vistas & Componentes Apple Glass"]
    Stores["Zustand Stores (Auth, Canvas, AI, Settings)"]
    Services["Axios API Services"]
    UI --> Stores
    Stores --> Services
  end

  subgraph Backend["Monolito Modular Node.js / Express"]
    subgraph Middlewares["Cadena de Responsabilidad"]
      AuthMid["authenticate (JWT)"]
      ValMid["validateRequest (Zod)"]
      ReqLog["requestLogger (Pino)"]
    end

    subgraph Modules["Módulos de Dominio"]
      AuthMod["Auth (TOTP MFA, Bcrypt)"]
      ProjMod["Projects & Governance"]
      CanvasMod["Canvas ERD & DDL Engine"]
      AiMod["AI Copilot & BYOK Proxy"]
      OkfMod["OKF Vault & Packaging"]
    end

    subgraph Infrastructure["Persistencia & Cloud"]
      PgPool["PostgreSQL Native pg.Pool"]
      SupabaseStorage["Bóveda OKF Storage Bucket"]
      AiVendors["Google GenAI / OpenRouter API"]
    end
  end

  Services -->|HTTP / REST| Middlewares
  Middlewares --> Modules
  Modules --> PgPool
  OkfMod --> SupabaseStorage
  AiMod --> AiVendors
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
    tags: ['uml', 'sequence-diagram', 'interactions', 'mfa', 'copilot'],
    description: 'Interacciones temporales entre cliente, API, base de datos y proveedores de IA.',
    aiHooks: ['auth.mfa_flow', 'ai.prompt_flow'],
    generate: (project) => {
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

      const body = `# Diagramas de Secuencia — Flujos Críticos

**Proyecto:** ${project.name}

### Flujo 1: Consulta al Copiloto de Arquitectura con Aislamiento BYOK
\`\`\`mermaid
sequenceDiagram
  autonumber
  actor User as Arquitecto
  participant UI as ChatConsultantView
  participant Client as apiClient (Interceptor)
  participant API as AiController & Service
  participant DB as PostgreSQL (Contexto Vivo)
  participant AI as Proveedor IA (BYOK / Gemini)

  User->>UI: Envía consulta arquitectónica
  UI->>Client: POST /projects/:id/ai/chat
  Client->>Client: Inyecta X-User-Ai-Key & X-User-Ai-Model (Zero-Retention)
  Client->>API: HTTP Request con payload y cabeceras
  API->>DB: getProjectContext(requirements, entities, adrs)
  DB-->>API: Retorna contexto consolidado
  API->>AI: generateChat(messages + context)
  AI-->>API: Retorna cleanText + devsculptor-actions
  API-->>Client: Envelope uniforme { success: true, data: result }
  Client-->>UI: Renderiza respuesta y botones de inyección
  UI-->>User: Muestra recomendación arquitectónica
\`\`\`

### Flujo 2: Autenticación con Segundo Factor (MFA TOTP RFC 6238)
\`\`\`mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Portal as AuthPortal
  participant AuthSvc as AuthService (Backend)
  participant DB as PostgreSQL

  User->>Portal: Ingresa email y contraseña
  Portal->>AuthSvc: POST /auth/login
  AuthSvc->>DB: Verifica hash Bcrypt
  DB-->>AuthSvc: Usuario con mfa_enabled = true
  AuthSvc-->>Portal: 200 OK { mfa_required: true, temp_token }
  Portal->>User: Solicita código de 6 dígitos Authenticator
  User->>Portal: Ingresa código OTP
  Portal->>AuthSvc: POST /auth/mfa/verify-login (temp_token + code)
  AuthSvc->>AuthSvc: Valida ventana TOTP (RFC 6238)
  AuthSvc-->>Portal: 200 OK { token: JWT_ACCESS, user }
  Portal->>User: Acceso concedido al Estudio
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
    description: 'Máquinas de estado que rigen las decisiones arquitectónicas y la frescura documental.',
    aiHooks: ['adrs.status', 'okf.freshness'],
    generate: (project) => {
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

      const body = `# Diagramas de Estados y Máquinas de Transición

**Proyecto:** ${project.name}

### Estado 1: Ciclo de Vida de las Decisiones de Arquitectura (ADRs)
\`\`\`mermaid
stateDiagram-v2
  [*] --> DRAFT: Arquitecto o IA propone acta
  DRAFT --> PROPOSED: Revisión por el equipo técnico
  PROPOSED --> ACCEPTED: Ratificada y aprobada
  PROPOSED --> REJECTED: Inviable o descartada
  ACCEPTED --> SUPERSEDED: Sustituida por nuevo ADR
  REJECTED --> [*]
  SUPERSEDED --> [*]
\`\`\`

### Estado 2: Monitor de Frescura Documental en la Bóveda OKF
\`\`\`mermaid
stateDiagram-v2
  [*] --> FRESH: Compilado y sincronizado con PostgreSQL
  FRESH --> STALE: Modificación en Canvas, Requisitos o ADRs
  STALE --> DRIFT_DETECTED: Hash SHA-256 no coincide con el estado actual
  DRIFT_DETECTED --> FRESH: Recompilación y verificación de Bóveda OKF
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
    generate: (project) => {
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

      const body = `# Diagrama de Componentes de Software

**Proyecto:** ${project.name}

\`\`\`mermaid
flowchart LR
  subgraph FrontendComponent["Componente Web UI"]
    Router["View Screen Controller"]
    CanvasEditor["Canvas Visual ERD"]
    ChatCopilot["Compact Chat Copilot"]
    DocViewer["Consolidated Document Viewer"]
  end

  subgraph BackendComponent["Componente Núcleo de Gobernanza"]
    HttpApi["Express HTTP Endpoints"]
    AuthModule["Módulo de Seguridad & MFA"]
    AiModule["Motor de Inferencia & BYOK Proxy"]
    DdlCompiler["Compilador Multi-Dialecto DDL"]
    OkfEngine["Empaquetador de Bóveda OKF"]
  end

  subgraph DataLayer["Persistencia"]
    PostgresDb[(PostgreSQL 15+ Schema)]
    StorageBucket[(Supabase Storage: okf-vault)]
  end

  FrontendComponent -->|JSON Envelope| HttpApi
  HttpApi --> AuthModule
  HttpApi --> AiModule
  HttpApi --> DdlCompiler
  HttpApi --> OkfEngine
  AuthModule --> PostgresDb
  DdlCompiler --> PostgresDb
  OkfEngine --> StorageBucket
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
    tags: ['uml', 'deployment', 'cloud', 'supabase', 'mermaid'],
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

\`\`\`mermaid
flowchart TD
  subgraph ClientDevice["Dispositivo de Usuario"]
    Browser["Navegador Moderno (Chrome / Safari / Edge)"]
  end

  subgraph EdgeCloud["Red y Capa de Borde"]
    ViteHost["Hosting SPA (Vercel / Cloudflare Pages / Local)"]
    TlsTerm["Terminación TLS / SSL (HTTPS)"]
  end

  subgraph AppServer["Servidor de Aplicación (Node.js)"]
    NodeProcess["Node.js 20+ LTS (Express Runtime)"]
    PinoLogger["Pino Structured Logger"]
    RateLimiter["In-Memory Rate Limiter"]
  end

  subgraph CloudDatabase["Plataforma de Datos (Supabase Managed Cloud)"]
    PgPooler["PgBouncer Transaction Pooler (Puerto 6543)"]
    PostgresInstance["PostgreSQL 15 Server (RLS + Triggers)"]
    S3Storage["Supabase Storage Engine (Bucket: okf-vault)"]
  end

  subgraph ExternalAI["Servicios Satélite de IA"]
    OpenRouter["OpenRouter Gateway (Free Tier & Models)"]
    GoogleAi["Google GenAI API (Gemini 3.1 Flash Lite)"]
  end

  Browser -->|HTTPS :443| ViteHost
  Browser -->|REST API :3000| TlsTerm
  TlsTerm --> RateLimiter
  RateLimiter --> NodeProcess
  NodeProcess --> PinoLogger
  NodeProcess -->|SSL Connection| PgPooler
  PgPooler --> PostgresInstance
  NodeProcess -->|REST S3 Protocol| S3Storage
  NodeProcess -->|BYOK Proxy Outbound| OpenRouter
  NodeProcess -->|Default Outbound| GoogleAi
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
      entities.forEach((e) => {
        erMermaid += `  ${e.table_name} {\n`;
        (e.columns_json || []).forEach((col) => {
          const colRecord = col as unknown as Record<string, unknown>;
          const cleanType = (col.type || 'varchar').replace(/\(.*\)/, '').replace(/\s+/g, '_');
          const isPk = Boolean(colRecord.isPk || colRecord.is_pk);
          const isFk = Boolean(colRecord.isFk || colRecord.is_fk);
          erMermaid += `    ${cleanType} ${col.name} ${isPk ? 'PK' : isFk ? 'FK' : ''}\n`;
        });
        erMermaid += `  }\n`;
      });

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
            const isFk = Boolean(colRecord.isFk || colRecord.is_fk) ? '✓' : '-';
            const isNullable = col.nullable ? 'SÍ' : 'NO';
            const ref = colRecord.referencesTable ? `FK -> ${colRecord.referencesTable}` : (col.unique ? 'UNIQUE' : '-');
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
];
