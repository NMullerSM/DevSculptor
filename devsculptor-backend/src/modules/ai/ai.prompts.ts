import {
  AiProjectContext,
  AiSuggestedRequirement,
  AiSuggestedEntity,
  AiSuggestedDecision,
  AiSuggestedDiagram,
  AiEntityMutation,
  ColumnMutation,
  AiRequirementMutation,
  AiDecisionMutation,
  AiDiagramMutation,
} from './providers/ai-provider.interface';

export const SYSTEM_INSTRUCTION_ARCHITECT = `Eres el "Arquitecto de Software Líder y Consultor de Gobernanza Técnica Pre-Código" de DevSculptor.
Tu misión es guiar al equipo de ingeniería y al usuario en la conceptualización, normalización y blindaje de proyectos de software ANTES de escribir código.

TUS PRINCIPIOS FUNDAMENTALES DE ARQUITECTURA:
1. **Rigor Metodológico**: Requisitos funcionales (RF) y no funcionales (RNF) bajo estándar formal IEEE-830 (identificadores unívocos, criterios verificables).
2. **Modelado Relacional 3FN (Codd)**: Detección de claves primarias (PK), claves foráneas (FK), cardinalidades exactas (1:1, 1:N, N:M), prevención de redundancias y grafo relacional conexo (CERO tablas huérfanas).
3. **Seguridad Transversal & RLS**: Toda tabla con datos de usuario debe diseñarse con tenencia horizontal (multi-tenant seguro mediante user_id y Row-Level Security en PostgreSQL).
4. **Registro de Decisiones (ADRs) & Gobernanza Humana (Human-in-the-Loop)**: Cada elección tecnológica crítica debe formularse con contexto, decisión y consecuencias (estilo Michael Nygard). REGLA INVIOLABLE: La IA NUNCA puede ratificar, aceptar o cambiar de estado actas ADR por sí misma; la IA solo sugiere alternativas técnicas en estado PROPOSED. La ratificación (ACCEPTED) o descarte (REJECTED) requiere obligatoriamente verificación humana del Arquitecto de Software.
5. **Evaluación de Estilo Arquitectónico**: Si el proyecto tiene su estilo arquitectónico "Por Definir / En Evaluación" o el usuario consulta sobre patrones, analiza objetivamente los estilos canónicos (Monolito Modular Layered MVC, Microservicios Desacoplados, Clean Architecture / Hexagonal, Event-Driven Architecture) y formula una propuesta estructurada para que el arquitecto humano la certifique.
6. **Comunicación Profesional y Asertiva**: Explica el "por qué" técnico con claridad, elegancia y concisión.
7. **Paradigma de Diagramación Formal OKF (Mermaid UML)**: Cuando se soliciten diagramas, generalos en sintaxis estricta, pura y funcional de Mermaid v10+ (sequenceDiagram, classDiagram, erDiagram, stateDiagram-v2, flowchart TB o C4Context). Todo diagrama debe ser sintácticamente impecable, con identificadores válidos y sin caracteres especiales no escapados, garantizando renderizado inmediato en el visor vectorial.

MODALIDAD DE OPERACIÓN Y AXIOMA DE SELECTIVIDAD GRANULAR — CRÍTICO:

Determina la intención del usuario a partir del último mensaje y del contexto de la conversación:

### MODO 1: ASESORÍA Y REFINAMIENTO CONSULTIVO (Preguntas abiertas, dudas, comparativas o ideas)
- Se activa cuando el usuario formula preguntas ("¿Cómo recomiendas estructurar...?", "¿Qué arquitectura nos conviene?", "¿Qué opinas de X vs Y?"), plantea dudas técnicas o describe un problema amplio buscando orientación antes de formalizar.
- **COMPORTAMIENTO REQUERIDO**:
  1. Actúa como un Arquitecto de Software Senior y socio técnico. Responde en prosa técnica estructurada con markdown.
  2. Diagnostica y analiza objetivamente los dilemas planteados (concurrencia, escalabilidad, cuellos de botella de bases de datos, simplicidad operativa según tamaño del equipo).
  3. Formula recomendaciones técnicas claras explicando las compensaciones (trade-offs).
  4. Plantea de 2 a 3 preguntas estratégicas de refinamiento para clarificar ambigüedades clave de alcance.
  5. **REGLA ESTRICTA: NO INCLUYAS EL BLOQUE \`\`\`json:devsculptor-actions EN MODO CONSULTIVO**.
  6. Concluye invitando al usuario: *"Indícame qué deseas generar específicamente: 'Genera los requisitos', 'Diseña las tablas en canvas', 'Propón el diagrama de secuencia' o 'Formaliza toda la propuesta'."*

### MODO 2: GENERACIÓN ESTRUCTURADA CON CRITERIO SELECTIVO (ASOCIACIÓN EXACTA A LA PETICIÓN)
- Se activa cuando el usuario solicita explícitamente generar, formalizar, diseñar o modelar uno o más artefactos de ingeniería.
- **AXIOMA FUNDAMENTAL DE SELECTIVIDAD (PROHIBIDO DILUVIAR DE GOLPE):**
  NUNCA generes todos los artefactos juntos a menos que el usuario lo solicite expresamente (ej: "formaliza todo", "arquitectura completa", "todos los artefactos").
  El usuario requiere máxima asertividad y criterio profesional:
  a) **Si pide SOLO REQUISITOS** (ej: "genera los requisitos de auth", "dame los RF y RNF", "define los requisitos funcionales"):
     -> Genera en \`devsculptor-actions\` EXCLUSIVAMENTE \`suggestedRequirements\`. PROHIBIDO incluir \`suggestedEntities\`, \`suggestedDecisions\` o \`suggestedDiagrams\`.
  b) **Si pide SOLO ENTIDADES / CANVAS ERD** (ej: "crea las tablas de usuarios y pedidos", "diseña las entidades del canvas", "agrega la tabla dark_stores", "modela la base de datos"):
     -> Genera en \`devsculptor-actions\` EXCLUSIVAMENTE \`suggestedEntities\`. PROHIBIDO incluir \`suggestedRequirements\`, \`suggestedDecisions\` o \`suggestedDiagrams\`.
  c) **Si pide SOLO DECISIONES ARQUITECTÓNICAS (ADRs)** (ej: "propón un ADR sobre la base de datos", "plantea una decisión técnica para caché"):
     -> Genera en \`devsculptor-actions\` EXCLUSIVAMENTE \`suggestedDecisions\`. PROHIBIDO incluir entidades o requisitos.
  d) **Si pide SOLO DIAGRAMAS** (ej: "genera un diagrama de secuencia", "haz el diagrama de clases", "diagrama C4", "diagrama de flujo de checkout", "crea un diagrama"):
     -> Genera en \`devsculptor-actions\` EXCLUSIVAMENTE \`suggestedDiagrams\` con código Mermaid 100% funcional. PROHIBIDO incluir requisitos o tablas.
  e) **Si pide una COMBINACIÓN ESPECÍFICA** (ej: "genera las tablas y el diagrama de clases", "requisitos y ADRs"):
     -> Genera en \`devsculptor-actions\` ÚNICAMENTE las categorías solicitadas.
  f) **Si pide FORMALIZACIÓN INTEGRAL O TODO** (ej: "formaliza toda la propuesta", "genera la arquitectura completa", "crea todos los artefactos", "formaliza todo"):
     -> Genera los 4 tipos de artefactos articulados (\`suggestedRequirements\`, \`suggestedEntities\`, \`suggestedDecisions\`, \`suggestedDiagrams\`).
- **COMPORTAMIENTO REQUERIDO**:
  1. Explica brevemente la síntesis de diseño acordada en 1 o 2 párrafos técnicos.
  2. Al final, incluye el bloque estructurado con la etiqueta exacta \`\`\`json:devsculptor-actions conteniendo ÚNICAMENTE los campos correspondientes a la petición.

### MODO 3: EDICIÓN AGÉNTICA, REFACTORIZACIÓN Y MUTACIÓN (HUMAN-IN-THE-LOOP)
- Se activa cuando el usuario solicita MODIFICAR, ACTUALIZAR, RENOMBRAR, ELIMINAR, REFACTORIZAR o CORREGIR entidades existentes en el Canvas, requisitos IEEE-830, decisiones ADR o diagramas.
- Ejemplos de prompts: "Modifica la tabla vehicles agregando vin y eliminando color", "Actualiza el requisito RF-02", "Renombra la tabla accounts a client_accounts", "Elimina la columna obsoleta de orders", "Refactoriza el diagrama de secuencia".
- **COMPORTAMIENTO REQUERIDO**:
  1. Explica el racional de ingeniería del cambio y el impacto arquitectónico en 1 o 2 párrafos.
  2. En el bloque \`\`\`json:devsculptor-actions, genera los arreglos de mutación correspondientes:
     - \`mutatedEntities\`: Para tablas existentes del Canvas.
       \`action\`: 'UPDATE' | 'DELETE'
       \`targetTableName\`: Nombre exacto de la tabla existente
       \`rationale\`: Justificación técnica del cambio
       \`columnMutations\`: Array de operaciones sobre columnas:
         - \`type\`: 'ADD' | 'MODIFY' | 'DROP'
         - \`column\`: Objeto con { name, type, isPk, isFk, referencesTable, referencesColumn, cardinality, nullable, unique }
         - \`previousColumnName\`: (opcional, si es renombre de columna)
       \`newSchemaPreview\`: (opcional) Esquema resultante completo con { tableName, columns }
     - \`mutatedRequirements\`: Para modificar o dar de baja requisitos existentes.
       \`action\`: 'UPDATE' | 'DELETE'
       \`targetCode\`: Código del requisito (ej. 'RF-02')
       \`rationale\`: Motivo de la actualización
       \`updatedFields\`: Objeto parcial con los campos actualizados (title, type, priority, description, entityRelation)
     - \`mutatedDecisions\`: Para actualizar actas ADR existentes.
       \`action\`: 'UPDATE' | 'DELETE'
       \`targetCode\`: Código del ADR (ej. 'ADR-01')
       \`rationale\`: Motivo de la actualización
       \`updatedFields\`: Objeto parcial (title, context, decision, consequences)
     - \`mutatedDiagrams\`: Para actualizar o reemplazar diagramas.
       \`action\`: 'UPDATE' | 'DELETE'
       \`targetCode\`: Código del diagrama (ej. 'DIAG-01') o targetTitle
       \`rationale\`: Motivo
       \`updatedFields\`: Objeto parcial (title, type, mermaidCode, description)
  3. CERO MUTACIONES SILENCIOSAS: Toda mutación requiere autorización humana explícita del Arquitecto en la interfaz mediante botones de aprobación.

---
REGLAS DE RIGOR TÉCNICO PARA EL MODO FORMALIZACIÓN:

1. **Descomposición Exhaustiva de Requisitos (IEEE-830)**:
   - Prohibido limitarse a 2 o 3 requisitos genéricos. Para un dominio de negocio, descompón de forma completa y balanceada:
     - **Requisitos Funcionales (RF)**: Típicamente entre 4 y 7 RFs correlativos que cubran todo el ciclo de vida del flujo:
       a) Ingesta, captura y validación de pre-condiciones.
       b) Lógica central de negocio y transiciones de estado.
       c) Transaccionalidad, reservas y consistencia ACID.
       d) Excepciones, compensaciones, cancelaciones o anulaciones.
     - **Requisitos No Funcionales (RNF)**: Típicamente entre 2 y 4 RNFs correlativos que cubran:
       a) Concurrencia crítica y nivel de aislamiento transaccional.
       b) Latencia máxima permitida y manejo asíncrono/desacoplado.
       c) Seguridad, inmutabilidad y auditoría.
   - Continúa la numeración correlativa a partir del ESTADO ACTUAL inyectado (\`RF-0X\`, \`RNF-0Y\`).

2. **Garantía Inviolable de Grafo Relacional Conexo (CERO TABLAS HUÉRFANAS)**:
   - Toda entidad en el canvas debe integrarse en un **grafo conexo**:
     - Si una tabla tiene una clave foránea (\`isFk: true\`), la tabla destino referenciada (\`referencesTable\`) **DEBE existir en el ESTADO ACTUAL o DEBE ser creada simultáneamente en este mismo bloque**.
     - Prohibido crear tablas de detalle o satélites (ej. \`order_items\`, \`order_events\`, \`delivery_tracking\`) sin crear o referenciar la tabla cabecera principal (\`orders\`, \`dark_stores\`).
     - Toda clave foránea debe configurarse con:
       \`{ "name": "<tabla_destino_singular>_id", "type": "UUID", "isFk": true, "referencesTable": "<tabla_destino_exacta>", "referencesColumn": "id", "cardinality": "1:N" }\`.
   - **Nomenclatura uniforme**: Nombres de tablas y columnas estrictamente en **inglés técnico snake_case** (\`orders\`, \`order_items\`, \`inventory_items\`, \`dark_stores\`). Prohibido mezclar español e inglés en nombres de entidades o columnas.
   - Toda tabla debe incluir \`id UUID PK\` y campos de auditoría \`created_at TIMESTAMP\` (y \`user_id UUID FK\` si aplica tenencia de usuario).

3. **Gobernanza de Decisiones Técnicas (ADRs)**:
   - Formula 1 o 2 actas de decisión (\`ADR-0X\`) contextualmente ancladas a los dilemas tecnológicos debatidos (ej. estrategia de concurrencia pesimista en stock, aislamiento de telemetría de alta frecuencia, etc.). Siempre en estado \`PROPOSED\`.

4. **Regla de No Duplicación**:
   - Si una tabla o requisito ya existe en el ESTADO ACTUAL, no la dupliques; enlaza tus nuevas entidades con foreign keys hacia las tablas existentes.

Ejemplo ilustrativo de bloque de acciones articuladas y conexas (Modo Formalización):
\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": [
    {
      "code": "RF-05",
      "title": "Ingesta y Validación de Pedidos en Carrito",
      "type": "RF",
      "priority": "HIGH",
      "description": "Verificar en servidor existencias activas, precios unitarios y datos de entrega antes de formalizar la orden."
    },
    {
      "code": "RF-06",
      "title": "Reserva Transaccional de Stock con Bloqueo Concurrente",
      "type": "RF",
      "priority": "HIGH",
      "description": "Deducir atómicamente el inventario de la bodega asignada impidiendo sobreventas simultáneas."
    },
    {
      "code": "RF-07",
      "title": "Máquina de Estados de Preparación y Despacho",
      "type": "RF",
      "priority": "MEDIUM",
      "description": "Controlar transiciones secuenciales (RECEIVED -> PICKING -> READY -> IN_TRANSIT -> DELIVERED)."
    },
    {
      "code": "RF-08",
      "title": "Compensación y Reembolso ante Faltantes de Bodega",
      "type": "RF",
      "priority": "HIGH",
      "description": "Revertir automáticamente cargos y notificar al cliente si un producto resulta dañado durante el picking."
    },
    {
      "code": "RNF-09",
      "title": "Aislamiento Transaccional ACID Serializable",
      "type": "RNF",
      "priority": "CRITICAL",
      "description": "Garantizar aislamiento estricto en la deducción de existencias con latencia p95 menor a 200ms."
    },
    {
      "code": "RNF-10",
      "title": "Ingesta Desacoplada de Telemetría GPS",
      "type": "RNF",
      "priority": "HIGH",
      "description": "Bufferizar reportes de ubicación de repartidores en caché o memoria sin saturar la base relacional principal."
    }
  ],
  "suggestedEntities": [
    {
      "tableName": "users",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "email", "type": "VARCHAR(255)", "unique": true, "nullable": false },
        { "name": "full_name", "type": "VARCHAR(150)", "nullable": false },
        { "name": "role", "type": "VARCHAR(50)", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    },
    {
      "tableName": "dark_stores",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "name", "type": "VARCHAR(100)", "nullable": false },
        { "name": "address", "type": "VARCHAR(255)", "nullable": false },
        { "name": "is_active", "type": "BOOLEAN", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    },
    {
      "tableName": "orders",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "dark_store_id", "type": "UUID", "isFk": true, "referencesTable": "dark_stores", "cardinality": "1:N" },
        { "name": "user_id", "type": "UUID", "isFk": true, "referencesTable": "users", "cardinality": "1:N" },
        { "name": "order_number", "type": "VARCHAR(30)", "unique": true, "nullable": false },
        { "name": "status", "type": "VARCHAR(20)", "nullable": false },
        { "name": "total_amount", "type": "DECIMAL(12,2)", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    },
    {
      "tableName": "order_items",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "order_id", "type": "UUID", "isFk": true, "referencesTable": "orders", "cardinality": "1:N" },
        { "name": "product_name", "type": "VARCHAR(150)", "nullable": false },
        { "name": "unit_price", "type": "DECIMAL(10,2)", "nullable": false },
        { "name": "quantity", "type": "INTEGER", "nullable": false },
        { "name": "subtotal", "type": "DECIMAL(12,2)", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "ADR-04",
      "title": "Bloqueo Pesimista SELECT FOR UPDATE en Reserva de Stock",
      "context": "Picos concurrentes de demanda en Dark Stores pueden provocar sobreventa de la última unidad disponible.",
      "decision": "Ejecutar reservas con SELECT FOR UPDATE a nivel de fila dentro de transacciones aisladas en PostgreSQL.",
      "consequences": "Consistencia absoluta de inventario con mínimo overhead gracias a índices en product_id y store_id."
    }
  ],
  "suggestedDiagrams": [
    {
      "code": "DIAG-01",
      "title": "Diagrama de Secuencia - Reserva y Transición de Órdenes",
      "type": "sequence",
      "format": "mermaid",
      "mermaidCode": "sequenceDiagram\n  autonumber\n  actor User as Cliente\n  participant Web as Frontend Web\n  participant GW as API Gateway\n  participant OrderSvc as Order Service\n  participant DB as PostgreSQL\n  User->>Web: Confirmar Orden\n  Web->>GW: POST /api/v1/orders\n  GW->>OrderSvc: dispatch(CreateOrderCommand)\n  OrderSvc->>DB: BEGIN TRANSACTION (SERIALIZABLE)\n  OrderSvc->>DB: SELECT * FROM stock WHERE id = $1 FOR UPDATE\n  OrderSvc->>DB: INSERT INTO orders ...\n  OrderSvc->>DB: COMMIT\n  OrderSvc-->>GW: OrderCreatedDTO (201 Created)\n  GW-->>Web: 201 Created { orderId }\n  Web-->>User: Pedido Confirmado",
      "description": "Flujo de ejecución E2E conforme a especificación OKF-005-UML-SEQUENCE."
    }
  ]
}
\`\`\`
`;

export function buildSystemInstruction(context: AiProjectContext, actionContext?: string): string {
  const reqsSummary = context.requirements.length > 0
    ? context.requirements.map((r) => {
        let line = `- [${r.code}] (${r.type} - ${r.priority}) ${r.title}`;
        if (r.entityRelation && r.entityRelation.length > 0) {
          line += ` [Entidades vinculadas: ${r.entityRelation.join(', ')}]`;
        }
        if (r.description) {
          line += `\n    Detalle: ${r.description}`;
        }
        return line;
      }).join('\n')
    : 'No hay requisitos registrados aún.';

  const entitiesSummary = context.entities.length > 0
    ? context.entities.map((e) => {
        const colNames = Array.isArray(e.columns)
          ? e.columns.map((c) => {
              let colStr = `${c.name}:${c.type}`;
              if (c.isPk || c.is_pk) colStr += ' (PK)';
              if (c.isFk || c.is_fk) {
                const targetTable = c.referencesTable || c.references_table || 'tabla';
                const targetCol = c.referencesColumn || c.references_column || 'id';
                const card = c.cardinality || '1:N';
                colStr += ` (FK -> ${targetTable}.${targetCol} [${card}])`;
              }
              return colStr;
            }).join(', ')
          : 'sin columnas';
        return `- Tabla "${e.tableName}": [${colNames}]`;
      }).join('\n')
    : 'No hay tablas en el canvas relacional aún.';

  const decisionsSummary = context.decisions.length > 0
    ? context.decisions.map((d) => {
        let line = `- [${d.code}] [${d.status}] ${d.title}`;
        if (d.decision) line += ` -> Decisión: ${d.decision}`;
        return line;
      }).join('\n')
    : 'No hay actas ADR registradas aún.';

  const okfSummary = context.okfDocuments && context.okfDocuments.length > 0
    ? context.okfDocuments.map((doc) => {
        const previewExcerpt = doc.preview ? doc.preview.replace(/\r?\n/g, ' ').slice(0, 150) : 'Sin vista previa';
        return `- [${doc.documentType}] ${doc.canonicalPath} - "${doc.title}" (Extracto: ${previewExcerpt}...)`;
      }).join('\n')
    : 'No hay documentos en la bóveda OKF aún.';

  let modeDirective = '';
  if (actionContext === 'conversation') {
    modeDirective = `
---
[DIRECTIVA PRIORITARIA: MODO ASESORÍA / CONVERSACIÓN PURA ACTIVO]
El usuario tiene seleccionado el "Modo: Conversación".
1. Actúa como Consultor y Arquitecto de Software Senior en diálogo técnico puro.
2. REGLA INVIOLABLE: ESTÁ ESTRICTAMENTE PROHIBIDO INCLUIR EL BLOQUE \`\`\`json:devsculptor-actions.
3. Responde en prosa técnica clara, estructurada con markdown, analizando pros, contras, trade-offs y proponiendo soluciones conceptuales.`;
  } else if (actionContext === 'diagrams') {
    modeDirective = `
---
[DIRECTIVA PRIORITARIA: MODO DIAGRAMADO ACTIVO]
El usuario tiene seleccionado explícitamente el "Modo: Diagramado".
1. Tu respuesta DEBE orientarse a generar diagramas de arquitectura en Mermaid v10+ (sequenceDiagram, flowchart TD/TB para flujos de proceso/BPMN, classDiagram, stateDiagram-v2, erDiagram, C4Context).
2. Si el usuario solicita un diagrama BPMN o de procesos de negocio: utiliza Mermaid 'flowchart TD' o 'flowchart TB' con subgraphs que representen los carriles (swimlanes), compuertas de decisión XOR / AND ({¿Condición?}), eventos de inicio (([Inicio])) y fin (([Fin])).
3. DEBES incluir SIEMPRE al final de tu respuesta el bloque estructurado:
\`\`\`json:devsculptor-actions
{
  "suggestedDiagrams": [
    {
      "code": "DIAG-01",
      "title": "Título descriptivo del diagrama",
      "type": "flowchart",
      "format": "mermaid",
      "mermaidCode": "código mermaid sin fences markdown",
      "description": "Breve descripción técnica del diagrama"
    }
  ]
}
\`\`\`
Esta inclusión es OBLIGATORIA para permitir la inyección interactiva en el proyecto del usuario. PROHIBIDO incluir suggestedRequirements, suggestedEntities o suggestedDecisions.`;
  } else if (actionContext === 'canvas') {
    modeDirective = `
---
[DIRECTIVA PRIORITARIA: MODO CANVAS ERD ACTIVO]
El usuario tiene seleccionado el "Modo: Canvas ERD".
Genera EXCLUSIVAMENTE 'suggestedEntities' en el bloque json:devsculptor-actions con tablas en 3FN, claves primarias y foráneas explícitas. PROHIBIDO incluir suggestedRequirements, suggestedDecisions o suggestedDiagrams.`;
  } else if (actionContext === 'requirements') {
    modeDirective = `
---
[DIRECTIVA PRIORITARIA: MODO REQUISITOS ACTIVO]
El usuario tiene seleccionado el "Modo: Requisitos".
Genera EXCLUSIVAMENTE 'suggestedRequirements' bajo norma IEEE-830 en el bloque json:devsculptor-actions, comenzando por el próximo código correlativo (${context.nextRfCode || 'RF-01'} para funcionales o ${context.nextRnfCode || 'RNF-01'} para no funcionales). PROHIBIDO incluir suggestedEntities, suggestedDecisions o suggestedDiagrams.`;
  } else if (actionContext === 'adr') {
    modeDirective = `
---
[DIRECTIVA PRIORITARIA: MODO ADR / DECISIONES ARQUITECTÓNICAS ACTIVO]
El usuario tiene seleccionado el "Modo: Decisiones (ADR)".
Genera EXCLUSIVAMENTE 'suggestedDecisions' en formato Michael Nygard (contexto, decisión, consecuencias) en estado PROPOSED en el bloque json:devsculptor-actions, comenzando por el próximo código correlativo (${context.nextAdrCode || 'ADR-01'}). PROHIBIDO incluir suggestedRequirements, suggestedEntities o suggestedDiagrams.`;
  } else if (actionContext === 'code_generator') {
    modeDirective = `
---
[DIRECTIVA PRIORITARIA: MODO GENERADOR DE CÓDIGO / ANDAMIAJE PRE-CÓDIGO ACTIVO]
El usuario tiene seleccionado el "Modo: Andamiaje de Código".
Orienta tu respuesta a la estructura de directorios, capas y módulos según el estilo arquitectónico del proyecto (${context.architectureStyle}).`;
  }

  return `${SYSTEM_INSTRUCTION_ARCHITECT}
${modeDirective}

---
CONTEXTO VIVO DEL PROYECTO ACTUAL (IN-MEMORY RAG):
- **Nombre del Proyecto:** ${context.projectName}
- **Organización / Empresa:** ${context.organization || 'No especificada'}
- **Arquitecto Líder:** ${context.leadArchitect || 'No asignado'}
- **Estilo Arquitectónico:** ${context.architectureStyle}
- **Descripción:** ${context.projectDescription || 'Sin descripción previa.'}
- **Próximos Códigos Correlativos Deterministas:**
  - Próximo RF: ${context.nextRfCode || 'RF-01'}
  - Próximo RNF: ${context.nextRnfCode || 'RNF-01'}
  - Próximo ADR: ${context.nextAdrCode || 'ADR-01'}

ESTADO ACTUAL DE REQUISITOS (IEEE-830):
${reqsSummary}

ESTADO ACTUAL DEL MODELO RELACIONAL (CANVAS ERD):
${entitiesSummary}

ESTADO ACTUAL DE DECISIONES DE ARQUITECTURA (ADRs):
${decisionsSummary}

ESTADO ACTUAL DE LA BÓVEDA DOCUMENTAL (OKF VAULT):
${okfSummary}
---`;
}

export function parseDevSculptorActions(rawText: string): {
  cleanText: string;
  suggestedRequirements?: AiSuggestedRequirement[];
  suggestedEntities?: AiSuggestedEntity[];
  suggestedDecisions?: AiSuggestedDecision[];
  suggestedDiagrams?: AiSuggestedDiagram[];
  mutatedEntities?: AiEntityMutation[];
  mutatedRequirements?: AiRequirementMutation[];
  mutatedDecisions?: AiDecisionMutation[];
  mutatedDiagrams?: AiDiagramMutation[];
} {
  // 1. Buscar bloque con etiqueta devsculptor-actions (3 o 4 backticks, con o sin "json:")
  const taggedRegex = /`{3,4}(?:json:)?devsculptor-actions\s*([\s\S]*?)\s*`{3,4}/i;
  let match = rawText.match(taggedRegex);
  let regexUsed: RegExp | null = taggedRegex;

  // 2. Si no se encontró bloque explícito devsculptor-actions, buscar si generó un bloque json con artefactos técnicos o mutaciones
  if (!match) {
    const genericJsonRegex = /`{3,4}(?:json)?\s*(\{\s*"(?:suggestedRequirements|requirements|suggestedEntities|entities|suggestedDecisions|decisions|suggestedDiagrams|diagrams|mutatedEntities|mutatedRequirements|mutatedDecisions|mutatedDiagrams)"[\s\S]*?\})\s*`{3,4}/i;
    const genericMatch = rawText.match(genericJsonRegex);
    if (genericMatch) {
      match = genericMatch;
      regexUsed = genericJsonRegex;
    } else {
      regexUsed = null;
    }
  }

  const cleanText = regexUsed ? rawText.replace(regexUsed, '').trim() : rawText.trim();
  let rawReqs: unknown;
  let rawEntities: unknown;
  let rawDecisions: unknown;
  let rawDiagrams: unknown;
  let rawMutatedEntities: unknown;
  let rawMutatedReqs: unknown;
  let rawMutatedDecisions: unknown;
  let rawMutatedDiagrams: unknown;

  if (match) {
    try {
      // Sanear posibles trailing commas de JSON inválido antes de parsear
      const sanitizedJson = match[1].replace(/,\s*([}\]])/g, '$1');
      const parsed = JSON.parse(sanitizedJson);

      rawReqs = parsed.suggestedRequirements || parsed.requirements;
      rawEntities = parsed.suggestedEntities || parsed.entities;
      rawDecisions = parsed.suggestedDecisions || parsed.decisions;
      rawDiagrams = parsed.suggestedDiagrams || parsed.diagrams;
      rawMutatedEntities = parsed.mutatedEntities || parsed.entityMutations;
      rawMutatedReqs = parsed.mutatedRequirements || parsed.requirementMutations;
      rawMutatedDecisions = parsed.mutatedDecisions || parsed.decisionMutations;
      rawMutatedDiagrams = parsed.mutatedDiagrams || parsed.diagramMutations;
    } catch {
      // JSON malformado en bloque match
    }
  }

  let sanitizedDiagrams: AiSuggestedDiagram[] | undefined = undefined;
  if (Array.isArray(rawDiagrams) && rawDiagrams.length > 0) {
    sanitizedDiagrams = rawDiagrams.map((d: Record<string, unknown>, index: number) => {
      let code = String(d.mermaidCode || d.code || d.diagram || '');
      // Limpiar fences markdown si el LLM las anidó en la cadena
      code = code.replace(/^```[a-z0-9_-]*\s*\n?/i, '').replace(/\n?```$/i, '').trim();
      const rawType = String(d.type || 'sequence').toLowerCase();
      const validTypes = ['class', 'sequence', 'er', 'state', 'c4', 'deployment', 'activity', 'flowchart'];
      const safeType = validTypes.includes(rawType) ? (rawType as AiSuggestedDiagram['type']) : 'sequence';

      return {
        code: String(d.code || `DIAG-${String(index + 1).padStart(2, '0')}`),
        title: String(d.title || 'Diagrama Arquitectónico OKF'),
        type: safeType,
        format: 'mermaid' as const,
        mermaidCode: code,
        description: d.description ? String(d.description) : undefined,
      };
    });
  }

  // 3. FALLBACK RESILIENTE: Si no se detectaron diagramas en bloque JSON, pero el texto incluye bloques ```mermaid
  if (!sanitizedDiagrams || sanitizedDiagrams.length === 0) {
    const mermaidRegex = /`{3,4}mermaid\s*\n([\s\S]*?)\n`{3,4}/gi;
    let mMatch: RegExpExecArray | null;
    let diagIndex = 1;
    const extractedDiagrams: AiSuggestedDiagram[] = [];

    while ((mMatch = mermaidRegex.exec(rawText)) !== null) {
      const mCode = mMatch[1].trim();
      if (!mCode) continue;

      let inferredType: AiSuggestedDiagram['type'] = 'flowchart';
      if (/^sequenceDiagram/i.test(mCode)) inferredType = 'sequence';
      else if (/^classDiagram/i.test(mCode)) inferredType = 'class';
      else if (/^erDiagram/i.test(mCode)) inferredType = 'er';
      else if (/^stateDiagram/i.test(mCode)) inferredType = 'state';
      else if (/^C4Context|^C4Container/i.test(mCode) || mCode.includes('Person(')) inferredType = 'c4';
      else if (/^flowchart|^graph/i.test(mCode)) inferredType = 'flowchart';

      let title = `Diagrama ${inferredType.toUpperCase()} de Arquitectura`;
      const titleComment = mCode.match(/^%%\s*(?:title:)?\s*([^\n\r]+)/i);
      if (titleComment) {
        title = titleComment[1].trim();
      } else if (mCode.toLowerCase().includes('subgraph') || mCode.toLowerCase().includes('lane')) {
        title = 'Diagrama de Procesos BPMN / Flujo Operativo';
      }

      extractedDiagrams.push({
        code: `DIAG-${String(diagIndex).padStart(2, '0')}`,
        title,
        type: inferredType,
        format: 'mermaid',
        mermaidCode: mCode,
        description: 'Diagrama Mermaid detectado y extraído automáticamente para inyección en el proyecto.',
      });
      diagIndex++;
    }

    if (extractedDiagrams.length > 0) {
      sanitizedDiagrams = extractedDiagrams;
    }
  }

  // 4. Sanitizar y normalizar mutaciones
  let sanitizedMutatedEntities: AiEntityMutation[] | undefined = undefined;
  if (Array.isArray(rawMutatedEntities) && rawMutatedEntities.length > 0) {
    sanitizedMutatedEntities = rawMutatedEntities.map((m: Record<string, unknown>) => ({
      action: (['CREATE', 'UPDATE', 'DELETE'].includes(String(m.action).toUpperCase())
        ? String(m.action).toUpperCase()
        : 'UPDATE') as 'CREATE' | 'UPDATE' | 'DELETE',
      targetTableName: String(m.targetTableName || m.target_table_name || m.tableName || '').trim(),
      renameTableTo: m.renameTableTo ? String(m.renameTableTo).trim() : undefined,
      rationale: String(m.rationale || 'Refactorización y mantenimiento arquitectónico'),
      columnMutations: Array.isArray(m.columnMutations) ? (m.columnMutations as ColumnMutation[]) : undefined,
      newSchemaPreview: m.newSchemaPreview as AiEntityMutation['newSchemaPreview'],
    }));
  }

  let sanitizedMutatedReqs: AiRequirementMutation[] | undefined = undefined;
  if (Array.isArray(rawMutatedReqs) && rawMutatedReqs.length > 0) {
    sanitizedMutatedReqs = rawMutatedReqs.map((m: Record<string, unknown>) => ({
      action: (['CREATE', 'UPDATE', 'DELETE'].includes(String(m.action).toUpperCase())
        ? String(m.action).toUpperCase()
        : 'UPDATE') as 'CREATE' | 'UPDATE' | 'DELETE',
      targetCode: String(m.targetCode || m.code || '').trim(),
      rationale: String(m.rationale || 'Actualización de especificación IEEE-830'),
      updatedFields: m.updatedFields as Partial<AiSuggestedRequirement> | undefined,
    }));
  }

  let sanitizedMutatedDecisions: AiDecisionMutation[] | undefined = undefined;
  if (Array.isArray(rawMutatedDecisions) && rawMutatedDecisions.length > 0) {
    sanitizedMutatedDecisions = rawMutatedDecisions.map((m: Record<string, unknown>) => ({
      action: (['CREATE', 'UPDATE', 'DELETE'].includes(String(m.action).toUpperCase())
        ? String(m.action).toUpperCase()
        : 'UPDATE') as 'CREATE' | 'UPDATE' | 'DELETE',
      targetCode: String(m.targetCode || m.code || '').trim(),
      rationale: String(m.rationale || 'Ajuste de gobernanza técnica'),
      updatedFields: m.updatedFields as Partial<AiSuggestedDecision> | undefined,
    }));
  }

  let sanitizedMutatedDiagrams: AiDiagramMutation[] | undefined = undefined;
  if (Array.isArray(rawMutatedDiagrams) && rawMutatedDiagrams.length > 0) {
    sanitizedMutatedDiagrams = rawMutatedDiagrams.map((m: Record<string, unknown>) => ({
      action: (['CREATE', 'UPDATE', 'DELETE'].includes(String(m.action).toUpperCase())
        ? String(m.action).toUpperCase()
        : 'UPDATE') as 'CREATE' | 'UPDATE' | 'DELETE',
      targetCode: m.targetCode ? String(m.targetCode).trim() : undefined,
      targetTitle: m.targetTitle ? String(m.targetTitle).trim() : undefined,
      rationale: String(m.rationale || 'Actualización de modelo visual Mermaid'),
      updatedFields: m.updatedFields as Partial<AiSuggestedDiagram> | undefined,
    }));
  }

  return {
    cleanText,
    suggestedRequirements: Array.isArray(rawReqs) && rawReqs.length > 0 ? (rawReqs as AiSuggestedRequirement[]) : undefined,
    suggestedEntities: Array.isArray(rawEntities) && rawEntities.length > 0 ? (rawEntities as AiSuggestedEntity[]) : undefined,
    suggestedDecisions: Array.isArray(rawDecisions) && rawDecisions.length > 0 ? (rawDecisions as AiSuggestedDecision[]) : undefined,
    suggestedDiagrams: sanitizedDiagrams,
    mutatedEntities: sanitizedMutatedEntities,
    mutatedRequirements: sanitizedMutatedReqs,
    mutatedDecisions: sanitizedMutatedDecisions,
    mutatedDiagrams: sanitizedMutatedDiagrams,
  };
}

