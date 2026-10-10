import {
  GraphSpec,
  SequenceSpec,
  ProjectDiagramContext,
  DiagramNode,
  DiagramEdge,
} from '../diagram.types';

/**
 * 1. Diagrama de Clases del Dominio (OKF-004 / UML 2.5)
 * Derivado de las tablas y entidades modeladas en el Canvas del proyecto.
 */
export function buildProjectUmlClassesSpec(ctx: ProjectDiagramContext): GraphSpec {
  const tables = ctx.tables.length > 0 ? ctx.tables.slice(0, 20) : [
    {
      id: 'cls-user',
      name: 'User',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'email', type: 'string' },
        { name: 'createdAt', type: 'timestamp' },
      ],
      foreignKeys: [],
    },
    {
      id: 'cls-project',
      name: 'Project',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'userId', type: 'uuid', isForeign: true },
        { name: 'name', type: 'string' },
        { name: 'architectureStyle', type: 'string' },
      ],
      foreignKeys: [{ targetTable: 'User', targetColumn: 'id' }],
    },
    {
      id: 'cls-requirement',
      name: 'Requirement',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'projectId', type: 'uuid', isForeign: true },
        { name: 'title', type: 'string' },
        { name: 'type', type: 'string' },
      ],
      foreignKeys: [{ targetTable: 'Project', targetColumn: 'id' }],
    },
    {
      id: 'cls-decision',
      name: 'Decision',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'projectId', type: 'uuid', isForeign: true },
        { name: 'status', type: 'string' },
        { name: 'title', type: 'string' },
      ],
      foreignKeys: [{ targetTable: 'Project', targetColumn: 'id' }],
    },
  ];

  const nodes: DiagramNode[] = tables.map((tbl, idx) => {
    const colCount = tbl.columns?.length || 0;
    const pkCol = tbl.columns?.find((c) => c.isPrimary)?.name || 'id';

    return {
      id: tbl.id || `cls-${tbl.name}`,
      label: `class ${tbl.name}`,
      subtitle: `+PK ${pkCol} • CRUD Methods`,
      group: 'backend',
      badge: 'UML CLASS',
      status: 'ok',
      layer: Math.floor(idx / 2),
      description: `Entidad de dominio con métodos: create(), findById(), update(), delete()`,
      metrics: [
        { label: 'Propiedades', value: `${colCount} campos` },
        { label: 'Patrón', value: 'Active Record' },
      ],
      details: {
        Clase: tbl.name,
        ClavePrimaria: pkCol,
        Propiedades: tbl.columns?.map((c) => `${c.name}: ${c.type}`).slice(0, 4).join(', ') || 'N/A',
      },
    };
  });

  const edges: DiagramEdge[] = [];
  tables.forEach((tbl) => {
    const srcId = tbl.id || `cls-${tbl.name}`;
    if (tbl.foreignKeys && tbl.foreignKeys.length > 0) {
      tbl.foreignKeys.forEach((fk, fkIdx) => {
        const target = tables.find(
          (t) => t.id === fk.targetTable || t.name === fk.targetTable
        );
        if (target) {
          edges.push({
            id: `assoc-${srcId}-${target.id || target.name}-${fkIdx}`,
            from: srcId,
            to: target.id || `cls-${target.name}`,
            label: 'Asociación (1..*)',
            protocol: `FK -> ${fk.targetColumn || 'id'}`,
            animated: true,
            variant: 'accent',
          });
        }
      });
    }
  });

  if (edges.length === 0 && tables.length > 1) {
    for (let i = 0; i < tables.length - 1; i++) {
      edges.push({
        id: `assoc-auto-${i}`,
        from: tables[i].id || `cls-${tables[i].name}`,
        to: tables[i + 1].id || `cls-${tables[i + 1].name}`,
        label: 'Asociación 1:N',
        protocol: 'UML Association',
        animated: true,
        variant: 'default',
      });
    }
  }

  return {
    id: 'project-uml-classes',
    title: `Diagrama de Clases del Dominio: ${ctx.projectName || 'Proyecto Activo'}`,
    subtitle: `Formalizado en OKF-004-UML-CLASS (${tables.length} clases de modelo)`,
    description:
      'Estructura de clases, atributos tipados, identificadores primarios y relaciones del modelo de dominio compiladas para el estándar OKF.',
    kind: 'graph',
    category: 'project',
    badge: 'OKF-004 UML',
    icon: 'class',
    nodes,
    edges,
  };
}

/**
 * 2. Diagrama de Paquetes y Módulos (OKF-005 / Modular Monolith)
 */
export function buildProjectModularPackagesSpec(ctx: ProjectDiagramContext): GraphSpec {
  const style = ctx.architectureStyle || 'Monolito Modular Layered MVC';

  return {
    id: 'project-modular-packages',
    title: `Diagrama de Paquetes y Módulos: ${ctx.projectName || 'Proyecto'}`,
    subtitle: `Formalizado en OKF-005-UML-MODULAR-PACKAGES (${style})`,
    description:
      'Organización de paquetes lógicos, límites de contexto y control de dependencias unidireccionales.',
    kind: 'graph',
    category: 'project',
    badge: 'OKF-005 PACKAGES',
    icon: 'inventory_2',
    nodes: [
      {
        id: 'pkg-presentation',
        label: 'package presentation',
        subtitle: 'Routers, Controllers, DTOs',
        group: 'frontend',
        badge: 'PRESENTATION',
        status: 'ok',
        layer: 0,
        description: 'Manejo de rutas HTTP, endpoints de API y serialización.',
        metrics: [
          { label: 'Capa', value: 'API Gateway' },
          { label: 'Acoplamiento', value: 'Bajo' },
        ],
      },
      {
        id: 'pkg-core-services',
        label: 'package core.services',
        subtitle: 'Business Services, Use Cases',
        group: 'backend',
        badge: 'APPLICATION',
        status: 'ok',
        layer: 1,
        description: 'Coordinación de reglas de negocio, transacciones y lógica de dominio.',
        metrics: [
          { label: 'Servicios', value: 'Activos' },
          { label: 'Testing', value: 'Unit / Integration' },
        ],
      },
      {
        id: 'pkg-domain-models',
        label: 'package domain.models',
        subtitle: 'Entities, Value Objects',
        group: 'governance',
        badge: 'DOMAIN',
        status: 'ok',
        layer: 2,
        description: 'Entidades puras del dominio de negocio sin dependencias externas.',
        metrics: [
          { label: 'Pureza', value: 'TypeScript Puro' },
          { label: 'Reglas', value: 'Invariantes' },
        ],
      },
      {
        id: 'pkg-infrastructure',
        label: 'package infrastructure',
        subtitle: 'Database Repositories, SDKs',
        group: 'database',
        badge: 'INFRA',
        status: 'ok',
        layer: 3,
        description: 'Acceso a datos PostgreSQL, almacenamiento y clientes de red.',
        metrics: [
          { label: 'Persistencia', value: 'PostgreSQL' },
          { label: 'Seguridad', value: 'RLS Policies' },
        ],
      },
    ],
    edges: [
      {
        id: 'pe-pkg-1',
        from: 'pkg-presentation',
        to: 'pkg-core-services',
        label: '«import»',
        protocol: 'DTO Invocations',
        animated: true,
        variant: 'accent',
      },
      {
        id: 'pe-pkg-2',
        from: 'pkg-core-services',
        to: 'pkg-domain-models',
        label: '«use»',
        protocol: 'Domain Entities',
        animated: true,
        variant: 'accent',
      },
      {
        id: 'pe-pkg-3',
        from: 'pkg-core-services',
        to: 'pkg-infrastructure',
        label: '«access»',
        protocol: 'Repository Provider',
        animated: true,
        variant: 'success',
      },
    ],
  };
}

/**
 * 3. Diagrama de Secuencia E2E (OKF-006 / Interacción de Componentes)
 */
export function buildProjectSequenceE2eSpec(ctx: ProjectDiagramContext): SequenceSpec {
  return {
    id: 'project-sequence-e2e',
    title: `Diagrama de Secuencia E2E: ${ctx.projectName || 'Proyecto'}`,
    subtitle: 'Formalizado en OKF-006-UML-SEQUENCE (Simulación Interactiva Paso a Paso)',
    description:
      'Interacción temporal completa: Solicitud de cliente, intermediación de API, validación de negocio y persistencia ACID.',
    kind: 'sequence',
    category: 'project',
    badge: 'OKF-006 SEQUENCE',
    icon: 'swap_horiz',
    participants: [
      {
        id: 'seq-actor',
        label: 'Cliente / Navegador',
        subtitle: 'SPA React 18',
        group: 'client',
        icon: 'person',
      },
      {
        id: 'seq-api',
        label: 'API Gateway',
        subtitle: 'Express Controllers',
        group: 'frontend',
        icon: 'dns',
      },
      {
        id: 'seq-service',
        label: 'Capa de Negocio',
        subtitle: 'Services / UseCases',
        group: 'backend',
        icon: 'settings_suggest',
      },
      {
        id: 'seq-db',
        label: 'Base de Datos',
        subtitle: 'PostgreSQL + RLS',
        group: 'database',
        icon: 'storage',
      },
    ],
    messages: [
      {
        id: 'sm-1',
        from: 'seq-actor',
        to: 'seq-api',
        label: '1. HTTPS POST /api/v1/resource { data }',
        detail: 'Headers: Authorization Bearer JWT',
        type: 'sync',
      },
      {
        id: 'sm-2',
        from: 'seq-api',
        to: 'seq-api',
        label: '2. Validación de Schema de Entrada con Zod',
        detail: 'Payload Sanitization',
        type: 'self',
      },
      {
        id: 'sm-3',
        from: 'seq-api',
        to: 'seq-service',
        label: '3. executeUseCase(validatedPayload, userContext)',
        detail: 'In-Memory Service Call',
        type: 'sync',
      },
      {
        id: 'sm-4',
        from: 'seq-service',
        to: 'seq-db',
        label: '4. BEGIN Transaction; INSERT INTO table (...)',
        detail: 'SQL Transaccional con RLS Context',
        type: 'sync',
      },
      {
        id: 'sm-5',
        from: 'seq-db',
        to: 'seq-service',
        label: '5. COMMIT; Retorno de registro creado con ID',
        detail: 'PostgreSQL 200 OK',
        type: 'return',
      },
      {
        id: 'sm-6',
        from: 'seq-service',
        to: 'seq-api',
        label: '6. Entidad de Dominio enriquecida devuelta',
        detail: 'DTO Response Transform',
        type: 'return',
      },
      {
        id: 'sm-7',
        from: 'seq-api',
        to: 'seq-actor',
        label: '7. HTTP 201 Created con JSON estructurado',
        detail: 'Renderizado React UI',
        type: 'return',
      },
    ],
  };
}

/**
 * 4. Máquina de Estados de ADRs (OKF-007 / ISO/IEC/IEEE 42010)
 */
export function buildProjectAdrStateMachineSpec(ctx: ProjectDiagramContext): GraphSpec {
  return {
    id: 'project-adr-state-machine',
    title: `Máquina de Estados de ADRs: ${ctx.projectName || 'Proyecto'}`,
    subtitle: 'Formalizado en OKF-007-STATE-MACHINE (Gobernanza Human-in-the-Loop)',
    description:
      'Ciclo de vida formal de las Decisiones Arquitecturales: de PROPOSED a ACCEPTED o REJECTED con registro inmutable.',
    kind: 'graph',
    category: 'project',
    badge: 'OKF-007 ADR',
    icon: 'traffic',
    nodes: [
      {
        id: 'state-proposed',
        label: 'PROPOSED',
        subtitle: 'Decisión Propuesta',
        group: 'governance',
        badge: 'PROPOSED',
        status: ctx.adrsProposed > 0 ? 'warning' : 'neutral',
        layer: 0,
        description: 'La decisión ha sido formulada y espera revisión humana.',
        metrics: [
          { label: 'Propuestas', value: ctx.adrsProposed.toString() },
          { label: 'Revisión', value: 'Pendiente' },
        ],
      },
      {
        id: 'state-accepted',
        label: 'ACCEPTED',
        subtitle: 'Decisión Vinculante',
        group: 'database',
        badge: 'ACCEPTED',
        status: 'ok',
        layer: 1,
        description: 'Aprobada formalmente mediante Human-in-the-Loop. De estricto cumplimiento.',
        metrics: [
          { label: 'Aceptadas', value: ctx.adrsAccepted.toString() },
          { label: 'Vigencia', value: 'Activa' },
        ],
      },
      {
        id: 'state-rejected',
        label: 'REJECTED',
        subtitle: 'Alternativa Descartada',
        group: 'client',
        badge: 'REJECTED',
        status: 'critical',
        layer: 1,
        description: 'Evaluada y descartada con justificación documentada en la bitácora.',
        metrics: [
          { label: 'Rechazadas', value: ctx.adrsRejected.toString() },
          { label: 'Histórico', value: 'Inmutable' },
        ],
      },
    ],
    edges: [
      {
        id: 'se-1',
        from: 'state-proposed',
        to: 'state-accepted',
        label: 'Aprobación Humana HITL',
        protocol: 'Aceptación Formal',
        animated: true,
        variant: 'success',
      },
      {
        id: 'se-2',
        from: 'state-proposed',
        to: 'state-rejected',
        label: 'Descarte con Motivo',
        protocol: 'Rechazo Registrado',
        animated: true,
        variant: 'warning',
      },
      {
        id: 'se-3',
        from: 'state-accepted',
        to: 'state-proposed',
        label: 'Enmienda / Superseded',
        protocol: 'Re-evaluación',
        animated: false,
        variant: 'dashed',
      },
    ],
  };
}

/**
 * 5. Diagrama de Componentes C4 (OKF-008 / C4 Model Component Level)
 */
export function buildProjectC4ComponentsSpec(ctx: ProjectDiagramContext): GraphSpec {
  return {
    id: 'project-c4-components',
    title: `Diagrama de Componentes C4: ${ctx.projectName || 'Proyecto'}`,
    subtitle: 'Formalizado en OKF-008-UML-COMPONENTS (C4 Component Model)',
    description:
      'Componentes de software internos, responsabilidades de despacho, servicios de dominio y adaptadores de datos.',
    kind: 'graph',
    category: 'project',
    badge: 'OKF-008 C4',
    icon: 'dashboard',
    nodes: [
      {
        id: 'c4-spa',
        label: 'Componente: UI Client',
        subtitle: 'React UI Views & Hooks',
        group: 'frontend',
        badge: 'SPA UI',
        status: 'ok',
        layer: 0,
        description: 'Vistas interactivas, componentes React y gestión de estado.',
        metrics: [{ label: 'Render', value: 'Vite / React' }],
      },
      {
        id: 'c4-api-gateway',
        label: 'Componente: API Router',
        subtitle: 'Express Route Handlers',
        group: 'backend',
        badge: 'GATEWAY',
        status: 'ok',
        layer: 1,
        description: 'Controladores de peticiones HTTP, validación y respuesta.',
        metrics: [{ label: 'Seguridad', value: 'Zod + Auth' }],
      },
      {
        id: 'c4-domain-services',
        label: 'Componente: Domain Service',
        subtitle: 'Business Rules & Logic',
        group: 'governance',
        badge: 'DOMAIN',
        status: 'ok',
        layer: 2,
        description: 'Orquestación de servicios centrales de negocio y auditoría.',
        metrics: [{ label: 'Lógica', value: 'Transaccional' }],
      },
      {
        id: 'c4-database',
        label: 'Componente: DB Repository',
        subtitle: 'PostgreSQL Relational DB',
        group: 'database',
        badge: 'PERSISTENCE',
        status: 'ok',
        layer: 3,
        description: 'Acceso a datos persistentes con integridad referencial.',
        metrics: [{ label: 'Motor', value: 'PostgreSQL' }],
      },
    ],
    edges: [
      {
        id: 'c4-e1',
        from: 'c4-spa',
        to: 'c4-api-gateway',
        label: 'Llamadas API JSON',
        protocol: 'HTTPS / REST',
        animated: true,
        variant: 'accent',
      },
      {
        id: 'c4-e2',
        from: 'c4-api-gateway',
        to: 'c4-domain-services',
        label: 'Despacha Casos de Uso',
        protocol: 'In-Memory Service Call',
        animated: true,
        variant: 'accent',
      },
      {
        id: 'c4-e3',
        from: 'c4-domain-services',
        to: 'c4-database',
        label: 'Persiste Entidades',
        protocol: 'SQL Connections',
        animated: true,
        variant: 'success',
      },
    ],
  };
}

/**
 * 6. Diagrama de Despliegue en la Nube (OKF-009 / Cloud Deployment)
 */
export function buildProjectCloudDeploymentSpec(ctx: ProjectDiagramContext): GraphSpec {
  return {
    id: 'project-cloud-deployment',
    title: `Diagrama de Despliegue en la Nube: ${ctx.projectName || 'Proyecto'}`,
    subtitle: 'Formalizado en OKF-009-UML-DEPLOYMENT (Nodos de Infraestructura)',
    description:
      'Topología física y lógica de los nodos de cómputo, redes de distribución de contenido y persistencia en la nube.',
    kind: 'graph',
    category: 'project',
    badge: 'OKF-009 DEPLOY',
    icon: 'cloud_queue',
    nodes: [
      {
        id: 'node-cdn',
        label: 'Node: Global Edge CDN',
        subtitle: 'Vercel Edge Network / Cloudflare',
        group: 'client',
        badge: 'EDGE CDN',
        status: 'ok',
        layer: 0,
        description: 'Distribución estática del frontend con SSL/TLS 1.3.',
        metrics: [{ label: 'Latencia', value: '< 50ms' }],
      },
      {
        id: 'node-app-runner',
        label: 'Node: API Container',
        subtitle: 'Node.js 20 LTS Runtime',
        group: 'backend',
        badge: 'APP SERVER',
        status: 'ok',
        layer: 1,
        description: 'Contenedor de backend con auto-escalado horizontal.',
        metrics: [{ label: 'Cómputo', value: 'Linux Container' }],
      },
      {
        id: 'node-db-cluster',
        label: 'Node: PostgreSQL Cluster',
        subtitle: 'Managed Supabase Cloud DB',
        group: 'database',
        badge: 'DATABASE',
        status: 'ok',
        layer: 2,
        description: 'Cluster administrado con replicación y backups automáticos.',
        metrics: [{ label: 'Motor', value: 'PostgreSQL 15' }],
      },
      {
        id: 'node-vault-storage',
        label: 'Node: Object Storage',
        subtitle: 'Encrypted S3 / Vault Storage',
        group: 'security',
        badge: 'VAULT S3',
        status: 'ok',
        layer: 2,
        description: 'Almacenamiento de archivos y artefactos de exportación OKF.',
        metrics: [{ label: 'Cifrado', value: 'AES-256' }],
      },
    ],
    edges: [
      {
        id: 'de-1',
        from: 'node-cdn',
        to: 'node-app-runner',
        label: 'Rutas /api/*',
        protocol: 'HTTPS Proxy',
        animated: true,
        variant: 'accent',
      },
      {
        id: 'de-2',
        from: 'node-app-runner',
        to: 'node-db-cluster',
        label: 'Consultas SQL',
        protocol: 'Port 5432 (SSL)',
        animated: true,
        variant: 'accent',
      },
      {
        id: 'de-3',
        from: 'node-app-runner',
        to: 'node-vault-storage',
        label: 'Bóveda OKF',
        protocol: 'S3 API / TLS',
        animated: true,
        variant: 'success',
      },
    ],
  };
}

/**
 * 7. Diagrama Entidad-Relación Canvas (OKF-010 / Crow's Foot ERD)
 */
export function buildProjectErdMapSpec(ctx: ProjectDiagramContext): GraphSpec {
  const maxTables = 40;
  const rawTables = ctx.tables.slice(0, maxTables);

  const defaultTables = [
    {
      id: 'tbl-users',
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'email', type: 'varchar(255)' },
        { name: 'created_at', type: 'timestamp' },
      ],
      foreignKeys: [],
    },
    {
      id: 'tbl-projects',
      name: 'projects',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'user_id', type: 'uuid', isForeign: true },
        { name: 'name', type: 'varchar(100)' },
        { name: 'architecture_style', type: 'varchar(50)' },
      ],
      foreignKeys: [{ targetTable: 'tbl-users', targetColumn: 'id' }],
    },
    {
      id: 'tbl-requirements',
      name: 'requirements',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'project_id', type: 'uuid', isForeign: true },
        { name: 'code', type: 'varchar(20)' },
        { name: 'title', type: 'text' },
      ],
      foreignKeys: [{ targetTable: 'tbl-projects', targetColumn: 'id' }],
    },
    {
      id: 'tbl-decisions',
      name: 'decisions',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'project_id', type: 'uuid', isForeign: true },
        { name: 'status', type: 'varchar(20)' },
        { name: 'title', type: 'text' },
      ],
      foreignKeys: [{ targetTable: 'tbl-projects', targetColumn: 'id' }],
    },
  ];

  const tablesToRender = rawTables.length > 0 ? rawTables : defaultTables;

  const nodes: DiagramNode[] = tablesToRender.map((tbl, idx) => {
    const colCount = tbl.columns?.length || 0;
    const pkCol = tbl.columns?.find((c) => c.isPrimary)?.name || 'id';

    return {
      id: tbl.id || `tbl-${tbl.name}`,
      label: `Tabla: ${tbl.name}`,
      subtitle: `PK: ${pkCol} (${colCount} campos)`,
      group: 'database',
      badge: 'TABLE',
      status: 'ok',
      layer: Math.floor(idx / 2),
      description: `Entidad relacional persistida en Supabase con políticas RLS activas.`,
      metrics: [
        { label: 'Columnas', value: colCount.toString() },
        { label: 'Esquema', value: '3FN' },
      ],
      details: {
        Tabla: tbl.name,
        ClavePrimaria: pkCol,
        TotalCampos: colCount.toString(),
      },
    };
  });

  const edges: DiagramEdge[] = [];
  tablesToRender.forEach((tbl) => {
    const sourceId = tbl.id || `tbl-${tbl.name}`;
    if (tbl.foreignKeys && tbl.foreignKeys.length > 0) {
      tbl.foreignKeys.forEach((fk, fkIdx) => {
        const targetTbl = tablesToRender.find(
          (t) => t.id === fk.targetTable || t.name === fk.targetTable
        );
        if (targetTbl) {
          const targetId = targetTbl.id || `tbl-${targetTbl.name}`;
          edges.push({
            id: `fk-${sourceId}-${targetId}-${fkIdx}`,
            from: sourceId,
            to: targetId,
            label: 'Clave Foránea (FK)',
            protocol: `FK -> ${fk.targetColumn || 'id'}`,
            animated: true,
            variant: 'accent',
          });
        }
      });
    }
  });

  if (edges.length === 0 && tablesToRender.length > 1) {
    for (let i = 0; i < tablesToRender.length - 1; i++) {
      const src = tablesToRender[i].id || `tbl-${tablesToRender[i].name}`;
      const dst = tablesToRender[i + 1].id || `tbl-${tablesToRender[i + 1].name}`;
      edges.push({
        id: `fk-auto-${i}`,
        from: src,
        to: dst,
        label: 'Relación 1:N',
        protocol: 'Foreign Key',
        animated: true,
        variant: 'default',
      });
    }
  }

  return {
    id: 'project-erd-map',
    title: `Diagrama Entidad-Relación (ERD): ${ctx.projectName || 'Esquema'}`,
    subtitle: `Formalizado en OKF-010-DB-ERD-DICTIONARY (${tablesToRender.length} tablas)`,
    description:
      'Modelo relacional del Modelador de Código con detección de claves primarias, claves foráneas y trazabilidad referencial.',
    kind: 'graph',
    category: 'project',
    badge: 'OKF-010 ERD',
    icon: 'schema',
    nodes,
    edges,
  };
}

/**
 * 8. Pipeline de Gobernanza del Proyecto (OKF-001/002/003 / Engineering Traceability)
 */
export function buildProjectGovernancePipelineSpec(ctx: ProjectDiagramContext): GraphSpec {
  const reqs = ctx.reqsCount;
  const adrs = ctx.adrsCount;
  const tables = ctx.tablesCount;

  return {
    id: 'project-governance-pipeline',
    title: `Pipeline de Gobernanza: ${ctx.projectName || 'Proyecto'}`,
    subtitle: 'Formalizado en OKF-001/002/003 (Trazabilidad E2E de Artefactos)',
    description:
      'Trazabilidad en tiempo real desde los requerimientos de negocio hasta la compilación de la bóveda documental OKF.',
    kind: 'graph',
    category: 'project',
    badge: 'OKF PIPELINE',
    icon: 'linear_scale',
    nodes: [
      {
        id: 'pipe-reqs',
        label: 'Requisitos de Negocio',
        subtitle: 'RFs y RNFs del Sistema',
        group: 'frontend',
        badge: 'REQS',
        status: reqs > 0 ? 'ok' : 'info',
        layer: 0,
        description: 'Requisitos funcionales y no funcionales analizados.',
        metrics: [
          { label: 'Total RF/RNF', value: reqs.toString() },
          { label: 'Estado', value: reqs > 0 ? 'Definidos' : 'Inicial' },
        ],
      },
      {
        id: 'pipe-adrs',
        label: 'Decisiones de Arquitectura',
        subtitle: 'ADRs Formalizados',
        group: 'governance',
        badge: 'ADR',
        status: adrs > 0 ? 'ok' : 'warning',
        layer: 1,
        description: 'Decisiones técnicas validadas con Human-in-the-Loop.',
        metrics: [
          { label: 'Total ADRs', value: adrs.toString() },
          { label: 'Aceptados', value: ctx.adrsAccepted.toString() },
        ],
      },
      {
        id: 'pipe-erd',
        label: 'Modelado de Datos (ERD)',
        subtitle: 'Esquema Canvas 3FN',
        group: 'database',
        badge: 'SCHEMA',
        status: tables > 0 ? 'ok' : 'info',
        layer: 2,
        description: 'Entidades relacionales modeladas y listas para migración.',
        metrics: [
          { label: 'Tablas', value: tables.toString() },
          { label: 'Normalización', value: '3FN' },
        ],
      },
      {
        id: 'pipe-okf',
        label: 'Documentos OKF',
        subtitle: '19 Plantillas Consolidadas',
        group: 'security',
        badge: 'OKF BUNDLE',
        status: 'ok',
        layer: 3,
        description: 'Bóveda de entregables de arquitectura formalizados.',
        metrics: [
          { label: 'Plantillas', value: '19 Formales' },
          { label: 'Formatos', value: 'MD, HTML, PDF' },
        ],
      },
    ],
    edges: [
      {
        id: 'pe-1',
        from: 'pipe-reqs',
        to: 'pipe-adrs',
        label: 'Justifica Decisiones',
        protocol: 'Requisitos -> ADRs',
        animated: true,
        variant: 'accent',
      },
      {
        id: 'pe-2',
        from: 'pipe-adrs',
        to: 'pipe-erd',
        label: 'Define Esquema',
        protocol: 'ADRs -> Modelo DB',
        animated: true,
        variant: 'accent',
      },
      {
        id: 'pe-3',
        from: 'pipe-erd',
        to: 'pipe-okf',
        label: 'Consolida Entregables',
        protocol: 'Artefactos -> OKF',
        animated: true,
        variant: 'success',
      },
    ],
  };
}
