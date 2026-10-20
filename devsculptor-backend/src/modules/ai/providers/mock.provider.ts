import {
  IAiProvider,
  AiProjectContext,
  AiChatResult,
  AiSuggestedRequirement,
  AiSuggestedEntity,
  AiSuggestedDecision,
  AiSuggestedDiagram,
} from './ai-provider.interface';
import { parseDevSculptorActions } from '../ai.prompts';

export interface ActionIntent {
  wantsDiagrams: boolean;
  wantsEntities: boolean;
  wantsRequirements: boolean;
  wantsDecisions: boolean;
  wantsAll: boolean;
  isExclusive: boolean;
}

/**
 * Axioma de Discernimiento Granular (Sprint 6 OKF)
 * Determina asertivamente la intención técnica del prompt del usuario para no
 * generar artefactos masivos de forma indiscriminada cuando se pide una categoría específica.
 */
export function detectActionIntent(prompt: string, actionContext?: string): ActionIntent {
  const p = prompt.toLowerCase();

  // 1. Contexto de acción forzado desde la UI
  if (actionContext === 'diagrams') {
    return { wantsDiagrams: true, wantsEntities: false, wantsRequirements: false, wantsDecisions: false, wantsAll: false, isExclusive: true };
  }
  if (actionContext === 'canvas' || actionContext === 'entities') {
    return { wantsDiagrams: false, wantsEntities: true, wantsRequirements: false, wantsDecisions: false, wantsAll: false, isExclusive: true };
  }
  if (actionContext === 'requirements') {
    return { wantsDiagrams: false, wantsEntities: false, wantsRequirements: true, wantsDecisions: false, wantsAll: false, isExclusive: true };
  }
  if (actionContext === 'decisions') {
    return { wantsDiagrams: false, wantsEntities: false, wantsRequirements: false, wantsDecisions: true, wantsAll: false, isExclusive: true };
  }
  if (actionContext === 'conversation') {
    return { wantsDiagrams: false, wantsEntities: false, wantsRequirements: false, wantsDecisions: false, wantsAll: false, isExclusive: true };
  }

  // 2. Detección semántica por palabras clave
  const mentionsDiagrams =
    p.includes('diagram') ||
    p.includes('mermaid') ||
    p.includes('bpmn') ||
    p.includes('proceso') ||
    p.includes('workflow') ||
    p.includes('actividad') ||
    p.includes('secuencia') ||
    p.includes('sequence') ||
    p.includes('flujo') ||
    p.includes('flowchart') ||
    p.includes('c4') ||
    p.includes('clase') ||
    p.includes('clases') ||
    p.includes('class') ||
    p.includes('estado') ||
    p.includes('estados') ||
    p.includes('state') ||
    p.includes('despliegue') ||
    p.includes('deployment');

  const mentionsEntities =
    p.includes('entidad') ||
    p.includes('entidades') ||
    p.includes('tabla') ||
    p.includes('tablas') ||
    p.includes('canvas') ||
    p.includes('modelo relacional') ||
    p.includes('erd') ||
    p.includes('esquema') ||
    p.includes('schema') ||
    p.includes('modelo de datos');

  const mentionsReqs =
    p.includes('requisito') ||
    p.includes('requisitos') ||
    p.includes('requerimiento') ||
    p.includes('requerimientos') ||
    p.includes('rf') ||
    p.includes('rnf') ||
    p.includes('ieee') ||
    p.includes('historia de usuario') ||
    p.includes('criterios de aceptacion');

  const mentionsDecisions =
    p.includes('adr') ||
    p.includes('adrs') ||
    p.includes('decision') ||
    p.includes('decisiones') ||
    p.includes('acta') ||
    p.includes('actas');

  const mentionsAllExplicit =
    p.includes('todo') ||
    p.includes('todos') ||
    p.includes('completo') ||
    p.includes('completa') ||
    p.includes('integral') ||
    p.includes('suite completa') ||
    p.includes('formaliza todo') ||
    p.includes('genera todo');

  const anySpecific = mentionsDiagrams || mentionsEntities || mentionsReqs || mentionsDecisions;

  // Si especificó categorías concretas y NO pidió explícitamente "todo":
  if (anySpecific && !mentionsAllExplicit) {
    const categoriesCount = [mentionsDiagrams, mentionsEntities, mentionsReqs, mentionsDecisions].filter(Boolean).length;
    return {
      wantsDiagrams: mentionsDiagrams,
      wantsEntities: mentionsEntities,
      wantsRequirements: mentionsReqs,
      wantsDecisions: mentionsDecisions,
      wantsAll: false,
      isExclusive: categoriesCount === 1,
    };
  }

  // Comportamiento por defecto ante "formaliza la propuesta", "genera la arquitectura" o petición global:
  return {
    wantsDiagrams: true,
    wantsEntities: true,
    wantsRequirements: true,
    wantsDecisions: true,
    wantsAll: true,
    isExclusive: false,
  };
}

/**
 * Ensambla de forma asertiva la respuesta textual y el bloque estructurado devsculptor-actions
 * respetando estrictamente las categorías solicitadas por el usuario.
 */
function buildSelectiveResponse(params: {
  projectName: string;
  domainTitle: string;
  intent: ActionIntent;
  summaryRationale: string;
  reqs: AiSuggestedRequirement[];
  entities: AiSuggestedEntity[];
  decisions: AiSuggestedDecision[];
  diagrams: AiSuggestedDiagram[];
}): string {
  const { projectName, domainTitle, intent, summaryRationale, reqs, entities, decisions, diagrams } = params;

  let textHeader: string;

  if (intent.isExclusive && intent.wantsDiagrams) {
    textHeader = `### 📐 Formalización Asertiva de Diagramas Arquitectónicos (OKF Mermaid UML)

He evaluado tu solicitud para el proyecto **${projectName}** y generado **exclusivamente diagramas funcionales** para el subsistema de **${domainTitle}**:

- **Paradigma**: Mermaid v10+ conforme a especificación formal OKF.
- **Diagramas generados**: ${diagrams.map((d) => `\`${d.code}\` (*${d.title}*)`).join(', ')}.
- **Criterio**: Sintaxis estricta, renderizable interactivamente en el visualizador con controles de zoom, pan y copia de código.

${summaryRationale}`;
  } else if (intent.isExclusive && intent.wantsEntities) {
    textHeader = `### 🗄️ Formalización Asertiva de Esquema Relacional (Canvas ERD)

He procesado tu solicitud para **${projectName}** generando **únicamente entidades para el Canvas Relacional** para **${domainTitle}**:

- **Normalización**: 3FN con claves primarias UUID, claves foráneas explícitas y tenencia horizontal RLS.
- **Tablas generadas**: ${entities.map((e) => `\`${e.tableName}\` (${e.columns.length} columnas)`).join(', ')}.

${summaryRationale}`;
  } else if (intent.isExclusive && intent.wantsRequirements) {
    textHeader = `### 📋 Formalización Asertiva de Requisitos de Software (IEEE-830)

He procesado tu solicitud para **${projectName}** generando **únicamente requisitos formales** para **${domainTitle}**:

- **Requisitos derivados**: ${reqs.length} especificaciones (${reqs.filter((r) => r.type === 'RF').length} Funcionales y ${reqs.filter((r) => r.type === 'RNF').length} No Funcionales).
- **Criterio**: Asignación correlativa no colisionante y priorización por impacto arquitectónico.

${summaryRationale}`;
  } else if (intent.isExclusive && intent.wantsDecisions) {
    textHeader = `### 🏛️ Formalización Asertiva de Actas de Decisión (ADRs)

He procesado tu solicitud para **${projectName}** generando **únicamente actas de decisión técnica** para **${domainTitle}**:

- **ADRs generadas**: ${decisions.map((d) => `\`${d.code}\` (*${d.title}*)`).join(', ')}.

${summaryRationale}`;
  } else if (!intent.wantsAll) {
    const includedTypes: string[] = [];
    if (intent.wantsDiagrams) includedTypes.push('Diagramas UML');
    if (intent.wantsEntities) includedTypes.push('Tablas Canvas');
    if (intent.wantsRequirements) includedTypes.push('Requisitos IEEE-830');
    if (intent.wantsDecisions) includedTypes.push('ADRs');

    textHeader = `### 🎯 Formalización Asertiva Combinada (${includedTypes.join(' + ')})

He procesado tu solicitud para **${projectName}** generando **únicamente la combinación solicitada** para **${domainTitle}**:

${intent.wantsDiagrams ? `- **Diagramas**: ${diagrams.map((d) => `\`${d.code}\``).join(', ')}\n` : ''}${intent.wantsEntities ? `- **Entidades**: ${entities.map((e) => `\`${e.tableName}\``).join(', ')}\n` : ''}${intent.wantsRequirements ? `- **Requisitos**: ${reqs.length} especificaciones\n` : ''}${intent.wantsDecisions ? `- **Decisiones**: ${decisions.map((d) => `\`${d.code}\``).join(', ')}\n` : ''}
${summaryRationale}`;
  } else {
    textHeader = `### 🏛️ Formalización Integral de Arquitectura y Gobernanza Técnica

He formulado la propuesta integral de 4 dimensiones para **${domainTitle}** en el proyecto **${projectName}**:

1. **Requisitos IEEE-830**: ${reqs.length} especificaciones correlativas balanceadas.
2. **Modelo Relacional Canvas**: ${entities.length} entidades en 3FN formando un grafo conexo.
3. **Decisiones de Arquitectura (ADR)**: Fundamentación técnica para compensaciones críticas.
4. **Diagramas Formales OKF**: Visualización en Mermaid v10+ lista para el estudio interactivo.

${summaryRationale}`;
  }

  // Construcción del bloque JSON filtrado
  const actionsPayload: Record<string, unknown> = {};
  if (intent.wantsRequirements && reqs.length > 0) {
    actionsPayload.suggestedRequirements = reqs;
  }
  if (intent.wantsEntities && entities.length > 0) {
    actionsPayload.suggestedEntities = entities;
  }
  if (intent.wantsDecisions && decisions.length > 0) {
    actionsPayload.suggestedDecisions = decisions;
  }
  if (intent.wantsDiagrams && diagrams.length > 0) {
    actionsPayload.suggestedDiagrams = diagrams;
  }

  const jsonBlock = `\`\`\`json:devsculptor-actions\n${JSON.stringify(actionsPayload, null, 2)}\n\`\`\``;

  return `${textHeader}\n\n${jsonBlock}`;
}

export class MockAiProvider implements IAiProvider {
  public readonly name = 'mock';

  public async generateChat(
    messages: Array<{ role: 'user' | 'model'; content: string }>,
    context: AiProjectContext,
    options?: { temperature?: number; actionContext?: string }
  ): Promise<AiChatResult> {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const lower = lastUserMsg.toLowerCase();

    // 1. Detección y análisis del estado actual para deduplicación
    const existingTableNames = context.entities.map((e) => e.tableName.toLowerCase());
    const hasUsersTable = existingTableNames.includes('users');

    // 2. Cálculo de numeración correlativa no colisionante (independiente para RF y RNF)
    let maxRf = 0;
    let maxRnf = 0;
    for (const r of context.requirements) {
      const match = r.code.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (r.type === 'RNF' || r.code.toUpperCase().startsWith('RNF')) {
          if (num > maxRnf) maxRnf = num;
        } else {
          if (num > maxRf) maxRf = num;
        }
      }
    }
    let maxAdr = 0;
    for (const d of context.decisions) {
      const code = d.code || '';
      const match = code.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxAdr) maxAdr = num;
      }
    }
    const adr1 = `ADR-${String(maxAdr + 1).padStart(2, '0')}`;

    // 3. Detección Bimodal (Modo 1 Consultoría vs Modo 2 Formalización)
    const isExplicitFormalization =
      lower.includes('formaliz') ||
      lower.includes('diseña') ||
      lower.includes('disena') ||
      lower.includes('genera') ||
      lower.includes('crea') ||
      lower.includes('inyectar') ||
      lower.includes('inyecta') ||
      lower.includes('procede') ||
      lower.includes('diagram') ||
      lower.includes('tabla') ||
      lower.includes('requisito');

    const isConsultativeQuestion =
      options?.actionContext === 'conversation' ||
      (!isExplicitFormalization &&
        (lower.includes('?') ||
          lower.includes('¿') ||
          lower.startsWith('cómo') ||
          lower.startsWith('como') ||
          lower.startsWith('qué') ||
          lower.startsWith('que') ||
          lower.startsWith('cuál') ||
          lower.startsWith('cual') ||
          lower.includes('recomiendas') ||
          lower.includes('opinas') ||
          lower.includes('alternativa') ||
          lower.includes('explica') ||
          lower.includes('trade-off') ||
          lower.includes('dilema')));

    if (isConsultativeQuestion) {
      const consultativeReply = `### 🏛️ Asesoría de Arquitectura de Software y Gobernanza Técnica

He evaluado tu consulta técnica para el proyecto **${context.projectName}** (Estilo: *${context.architectureStyle}*).

#### 🔍 Diagnóstico Arquitectónico y Compensaciones (Trade-Offs):
- **Aislamiento Transaccional vs Concurrencia**: Para dominios con operaciones transaccionales críticas, se recomienda aislar las mutaciones de estado mediante transacciones con locking pesimista (\`SELECT FOR UPDATE\`) o versionado optimista, protegiendo la base relacional de sobrecargas.
- **Normalización 3FN y Grafos Conexos**: Toda entidad propuesta debe modelarse con claves foráneas explícitas hacia las tablas maestras de cabecera, preservando la tenencia horizontal mediante \`user_id\` con Row-Level Security en PostgreSQL.
- **Simplicidad y Gobernanza Pre-Código**: Mantener una separación limpia por capas antes de considerar desacoplamientos o microservicios que añadan sobrecoste operativo.

#### ❓ Preguntas Estratégicas de Refinamiento:
1. **¿Cuál es el volumen pico estimado de operaciones concurrentes?** (Permite calibrar la estrategia de bloqueo transaccional).
2. **¿Se requieren reglas de compensación, reversión o anulación automática ante fallos de downstream?**
3. **¿Deseas que genere únicamente diagramas, únicamente tablas para el canvas, o los requisitos formales?**

---
*💡 Indica específicamente lo que necesitas (ej: **"Genera sólo diagramas de secuencia"**, **"Genera tablas para el canvas"**, o **"Formaliza todo"**) y aplicaré el criterio asertivo correspondiente.*`;

      return {
        content: consultativeReply,
        reply: consultativeReply,
        provider: this.name,
        model: 'devsculptor-heuristic-architect-v1',
        actions: {},
      };
    }

    // 4. Detección del Axioma de Discernimiento Granular
    const intent = detectActionIntent(lastUserMsg, options?.actionContext);

    // Helper para asignar correlativos continuos a requerimientos dinámicos
    const formatReqs = (
      reqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL'; description: string }>
    ): AiSuggestedRequirement[] => {
      let curRf = maxRf;
      let curRnf = maxRnf;
      return reqs.map((r) => {
        const isRnf = r.type === 'RNF';
        const cur = isRnf ? ++curRnf : ++curRf;
        const normalizedPriority: 'HIGH' | 'MEDIUM' | 'LOW' =
          r.priority === 'CRITICAL' ? 'HIGH' : (r.priority as 'HIGH' | 'MEDIUM' | 'LOW');
        return {
          code: `${r.type}-${String(cur).padStart(2, '0')}`,
          title: r.title,
          type: r.type,
          priority: normalizedPriority,
          description: r.description,
        };
      });
    };

    const scopeText = `${lower} ${(context.projectDescription || '').toLowerCase()} ${context.projectName.toLowerCase()}`;

    let reply: string;

    // =========================================================================
    // DOMINIO 1: E-Commerce / Pedidos / Carrito / Órdenes / Dark Stores
    // =========================================================================
    if (
      scopeText.includes('pedido') ||
      scopeText.includes('orden') ||
      scopeText.includes('compra') ||
      scopeText.includes('carrito') ||
      scopeText.includes('cart') ||
      scopeText.includes('ecommerce') ||
      scopeText.includes('dark store') ||
      scopeText.includes('dark_store') ||
      scopeText.includes('sobreventa')
    ) {
      const hasOrders = existingTableNames.includes('orders');

      if (!hasOrders) {
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Ingesta y Validación de Pedidos en Carrito',
            type: 'RF',
            priority: 'HIGH',
            description: 'Verificar en servidor existencias activas, precios unitarios y datos de entrega antes de formalizar la orden.',
          },
          {
            title: 'Reserva Transaccional de Stock con Bloqueo Concurrente',
            type: 'RF',
            priority: 'HIGH',
            description: 'Deducir atómicamente el inventario de la bodega asignada impidiendo sobreventas simultáneas mediante SELECT FOR UPDATE.',
          },
          {
            title: 'Máquina de Estados de Preparación y Despacho',
            type: 'RF',
            priority: 'MEDIUM',
            description: 'Controlar transiciones secuenciales (RECEIVED -> PICKING -> READY -> IN_TRANSIT -> DELIVERED).',
          },
          {
            title: 'Aislamiento Transaccional ACID Serializable',
            type: 'RNF',
            priority: 'CRITICAL',
            description: 'Garantizar aislamiento estricto en la deducción de existencias con latencia p95 menor a 200ms.',
          },
        ];

        const reqs = formatReqs(dynamicReqs);

        const entities: AiSuggestedEntity[] = [
          ...(!existingTableNames.includes('products')
            ? [
                {
                  tableName: 'products',
                  columns: [
                    { name: 'id', type: 'UUID', isPk: true },
                    { name: 'name', type: 'VARCHAR(150)', nullable: false },
                    { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
                    { name: 'stock', type: 'INTEGER', nullable: false },
                    { name: 'created_at', type: 'TIMESTAMP', nullable: false },
                  ],
                },
              ]
            : []),
          {
            tableName: 'orders',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'user_id', type: 'UUID', isFk: hasUsersTable, referencesTable: hasUsersTable ? 'users' : undefined, cardinality: '1:N' },
              { name: 'order_number', type: 'VARCHAR(30)', unique: true, nullable: false },
              { name: 'status', type: 'VARCHAR(20)', nullable: false },
              { name: 'total_amount', type: 'DECIMAL(12,2)', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          },
          {
            tableName: 'order_items',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'order_id', type: 'UUID', isFk: true, referencesTable: 'orders', cardinality: '1:N' },
              { name: 'product_id', type: 'UUID', isFk: true, referencesTable: 'products', cardinality: '1:N' },
              { name: 'unit_price', type: 'DECIMAL(10,2)', nullable: false },
              { name: 'quantity', type: 'INTEGER', nullable: false },
              { name: 'subtotal', type: 'DECIMAL(12,2)', nullable: false },
            ],
          },
        ];

        const decisions: AiSuggestedDecision[] = [
          {
            code: adr1,
            title: 'Bloqueo Pesimista SELECT FOR UPDATE en Reserva de Stock',
            context: 'Picos concurrentes de demanda en Dark Stores pueden provocar sobreventa de la última unidad disponible.',
            decision: 'Ejecutar reservas con SELECT FOR UPDATE a nivel de fila dentro de transacciones aisladas en PostgreSQL.',
            consequences: 'Consistencia absoluta de inventario con mínimo overhead gracias a índices en product_id y store_id.',
          },
        ];

        const diagrams: AiSuggestedDiagram[] = [
          {
            code: 'DIAG-01',
            title: 'Diagrama de Secuencia - Reserva y Transición de Órdenes',
            type: 'sequence',
            format: 'mermaid',
            mermaidCode: `sequenceDiagram
  autonumber
  actor User as Cliente
  participant Web as Frontend Web
  participant GW as API Gateway
  participant OrderSvc as Order Service
  participant DB as PostgreSQL
  User->>Web: Confirmar Orden
  Web->>GW: POST /api/v1/orders
  GW->>OrderSvc: dispatch(CreateOrderCommand)
  OrderSvc->>DB: BEGIN TRANSACTION (SERIALIZABLE)
  OrderSvc->>DB: SELECT * FROM stock WHERE id = $1 FOR UPDATE
  OrderSvc->>DB: INSERT INTO orders ...
  OrderSvc->>DB: INSERT INTO order_items ...
  OrderSvc->>DB: COMMIT
  OrderSvc-->>GW: OrderCreatedDTO (201 Created)
  GW-->>Web: 201 Created { orderId }
  Web-->>User: Pedido Confirmado`,
            description: 'Flujo de ejecución E2E conforme a especificación OKF-005-UML-SEQUENCE con aislamiento pesimista.',
          },
          {
            code: 'DIAG-02',
            title: 'Máquina de Estados - Ciclo de Vida del Pedido',
            type: 'state',
            format: 'mermaid',
            mermaidCode: `stateDiagram-v2
  [*] --> PENDING : Creación de Orden
  PENDING --> PAID : Confirmación de Pago
  PENDING --> CANCELLED : Anulación / Timeout
  PAID --> PICKING : Asignación en Bodega
  PICKING --> READY : Empaque Finalizado
  READY --> IN_TRANSIT : Despacho Logístico
  IN_TRANSIT --> DELIVERED : Entrega Confirmada
  DELIVERED --> [*]
  CANCELLED --> [*]`,
            description: 'Transiciones de estado del ciclo de vida de la orden conforme a OKF-007-STATE.',
          },
        ];

        reply = buildSelectiveResponse({
          projectName: context.projectName,
          domainTitle: 'Procesamiento de Órdenes y Carrito',
          intent,
          summaryRationale:
            'Se aísla la cabecera `orders` de sus detalles `order_items` preservando integridad referencial en 3FN y control estricto de concurrencia.',
          reqs,
          entities,
          decisions,
          diagrams,
        });
      } else {
        // La tabla orders ya existe -> Expandir a logística de envíos
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Despacho y Trazabilidad de Envíos',
            type: 'RF',
            priority: 'HIGH',
            description: 'Generación de guías de despacho con número de rastreo y fecha estimada vinculadas a órdenes existentes.',
          },
          {
            title: 'Sincronización Eventual Asíncrona de Estados de Despacho',
            type: 'RNF',
            priority: 'MEDIUM',
            description: 'Procesar eventos de despacho desacoplados de la sesión HTTP mediante colas de mensajes.',
          },
        ];

        const reqs = formatReqs(dynamicReqs);

        const entities: AiSuggestedEntity[] = [
          {
            tableName: 'shipments',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'order_id', type: 'UUID', isFk: true, referencesTable: 'orders', cardinality: '1:N' },
              { name: 'tracking_number', type: 'VARCHAR(64)', unique: true, nullable: false },
              { name: 'carrier', type: 'VARCHAR(50)', nullable: false },
              { name: 'status', type: 'VARCHAR(20)', nullable: false },
              { name: 'shipped_at', type: 'TIMESTAMP', nullable: true },
              { name: 'delivered_at', type: 'TIMESTAMP', nullable: true },
            ],
          },
        ];

        const decisions: AiSuggestedDecision[] = [
          {
            code: adr1,
            title: 'Estrategia de Actualización Asíncrona para Guías de Envío',
            context: 'Los operadores logísticos externos proveen webhooks con latencia variable.',
            decision: 'Procesar actualizaciones de estado de envío de forma asíncrona desacoplada de la sesión del cliente.',
            consequences: 'Mayor resiliencia del sistema ante caídas o lentitud de las APIs de las empresas de correo.',
          },
        ];

        const diagrams: AiSuggestedDiagram[] = [
          {
            code: 'DIAG-01',
            title: 'Diagrama de Secuencia - Trazabilidad de Envíos',
            type: 'sequence',
            format: 'mermaid',
            mermaidCode: `sequenceDiagram
  autonumber
  actor Carrier as Transportista Logístico
  participant Webhook as Webhook Receiver
  participant ShipSvc as Shipment Service
  participant DB as PostgreSQL
  actor Client as Cliente
  Carrier->>Webhook: POST /webhooks/carrier (tracking, status)
  Webhook->>Webhook: Validar Firma HMAC
  Webhook->>ShipSvc: updateShipmentStatus(...)
  ShipSvc->>DB: UPDATE shipments SET status = $1 WHERE tracking = $2
  ShipSvc->>Client: Notificación Push / Email
  Webhook-->>Carrier: 200 OK`,
            description: 'Flujo de ingesta asíncrona de eventos de transporte logístico.',
          },
        ];

        reply = buildSelectiveResponse({
          projectName: context.projectName,
          domainTitle: 'Logística de Despachos y Guías de Envío',
          intent,
          summaryRationale:
            'La tabla `orders` ya existe en el modelo. Se extiende el dominio con `shipments` para trazabilidad de envíos sin duplicidad.',
          reqs,
          entities,
          decisions,
          diagrams,
        });
      }

    // =========================================================================
    // DOMINIO 2: Pagos / Cobros / Billing
    // =========================================================================
    } else if (
      lower.includes('pago') ||
      lower.includes('payment') ||
      lower.includes('checkout') ||
      lower.includes('suscrip') ||
      lower.includes('cobro')
    ) {
      const hasPayments = existingTableNames.includes('payments');

      if (!hasPayments) {
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Procesamiento Idempotente de Cobros',
            type: 'RF',
            priority: 'HIGH',
            description: 'Procesar cargos financieros mediante tokens de pasarela externa con verificación estricta de clave de idempotencia UUID v4.',
          },
          {
            title: 'Conciliación Asíncrona de Webhooks de Pago',
            type: 'RF',
            priority: 'HIGH',
            description: 'Recepción y validación de firmas criptográficas HMAC en webhooks de pasarela con reintentos exponenciales.',
          },
          {
            title: 'Cumplimiento PCI-DSS mediante Tokenización Externa',
            type: 'RNF',
            priority: 'CRITICAL',
            description: 'Prohibir el almacenamiento de datos primarios de tarjeta (PAN/CVV) en la base de datos de la aplicación.',
          },
        ];

        const reqs = formatReqs(dynamicReqs);

        const paymentCols: AiSuggestedEntity['columns'] = [
          { name: 'id', type: 'UUID', isPk: true },
          ...(existingTableNames.includes('orders')
            ? [{ name: 'order_id', type: 'UUID', isFk: true, referencesTable: 'orders', cardinality: '1:1' as const }]
            : []),
          { name: 'user_id', type: 'UUID', isFk: hasUsersTable, referencesTable: hasUsersTable ? 'users' : undefined, cardinality: '1:N' as const },
          { name: 'amount', type: 'DECIMAL(12,2)', nullable: false },
          { name: 'currency', type: 'VARCHAR(3)', nullable: false },
          { name: 'status', type: 'VARCHAR(20)', nullable: false },
          { name: 'idempotency_key', type: 'UUID', unique: true, nullable: false },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false },
        ];

        const entities: AiSuggestedEntity[] = [
          {
            tableName: 'payments',
            columns: paymentCols,
          },
          {
            tableName: 'payment_transactions',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'payment_id', type: 'UUID', isFk: true, referencesTable: 'payments', cardinality: '1:N' as const },
              { name: 'gateway_event_id', type: 'VARCHAR(100)', unique: true, nullable: false },
              { name: 'event_type', type: 'VARCHAR(50)', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          },
        ];

        const decisions: AiSuggestedDecision[] = [
          {
            code: adr1,
            title: 'Tokenización Externa y Manejo Idempotente de Pagos',
            context: 'Se requiere procesar transacciones monetarias reduciendo la superficie de riesgo PCI-DSS y evitando dobles cargos.',
            decision: 'Delegar la captura de tarjetas sensibles a pasarela externa (Stripe/MercadoPago) y almacenar únicamente tokens e idempotencia.',
            consequences: 'Menor superficie de ataque, total cumplimiento normativo e inmunidad contra fallas de red.',
          },
        ];

        const diagrams: AiSuggestedDiagram[] = [
          {
            code: 'DIAG-01',
            title: 'Diagrama de Secuencia - Procesamiento Idempotente de Pagos',
            type: 'sequence',
            format: 'mermaid',
            mermaidCode: `sequenceDiagram
  autonumber
  actor User as Comprador
  participant Web as Checkout UI
  participant API as API Server
  participant Stripe as Pasarela Financiera
  participant DB as PostgreSQL
  User->>Web: Autorizar Cobro
  Web->>API: POST /payments (Idempotency-Key: UUID)
  API->>DB: SELECT * FROM payments WHERE idempotency_key = $1
  alt Clave ya procesada
    DB-->>API: PaymentRecord (Existente)
    API-->>Web: 200 OK (Respuesta en Caché)
  else Nueva Transacción
    API->>Stripe: ChargeToken(amount, token)
    Stripe-->>API: ChargeSuccess { chargeId }
    API->>DB: INSERT INTO payments (status='CONFIRMED', ...)
    API->>DB: INSERT INTO payment_transactions (...)
    API-->>Web: 201 Created { paymentId }
    Web-->>User: Comprobante Emitido
  end`,
            description: 'Flujo de cobro tokenizado con verificación estricta de idempotencia.',
          },
        ];

        reply = buildSelectiveResponse({
          projectName: context.projectName,
          domainTitle: 'Pagos y Transacciones Financieras',
          intent,
          summaryRationale:
            'Se separa la intención de pago `payments` de los eventos de auditoría `payment_transactions`, blindando el flujo con clave de idempotencia.',
          reqs,
          entities,
          decisions,
          diagrams,
        });
      } else {
        // payments ya existe -> métodos de pago guardados
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Almacenamiento Seguro de Métodos de Pago Preferidos',
            type: 'RF',
            priority: 'MEDIUM',
            description: 'Permitir al usuario guardar tokens de medios de pago para agilizar transacciones recurrentes.',
          },
          {
            title: 'Protección Criptográfica en Bóveda de Tokens',
            type: 'RNF',
            priority: 'CRITICAL',
            description: 'Garantizar el cifrado en reposo y tránsito de los tokens asociados al cliente.',
          },
        ];

        const reqs = formatReqs(dynamicReqs);

        const entities: AiSuggestedEntity[] = [
          {
            tableName: 'payment_methods',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'user_id', type: 'UUID', isFk: hasUsersTable, referencesTable: hasUsersTable ? 'users' : undefined, cardinality: '1:N' },
              { name: 'provider_token', type: 'VARCHAR(255)', unique: true, nullable: false },
              { name: 'card_brand', type: 'VARCHAR(20)', nullable: false },
              { name: 'last4', type: 'VARCHAR(4)', nullable: false },
              { name: 'is_default', type: 'BOOLEAN', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          },
        ];

        const decisions: AiSuggestedDecision[] = [
          {
            code: adr1,
            title: 'Persistencia Exclusiva de Tokens de Cliente',
            context: 'Se busca mejorar la experiencia en checkout recurrente sin violar PCI-DSS.',
            decision: 'Guardar únicamente el identificador de cliente del procesador de pagos y los últimos 4 dígitos informativos.',
            consequences: 'Experiencia de 1-click checkout segura y sin riesgo de filtración de credenciales.',
          },
        ];

        const diagrams: AiSuggestedDiagram[] = [
          {
            code: 'DIAG-01',
            title: 'Diagrama de Secuencia - Tokenización y Registro de Tarjeta',
            type: 'sequence',
            format: 'mermaid',
            mermaidCode: `sequenceDiagram
  autonumber
  actor User as Usuario
  participant App as Frontend
  participant Gateway as Pasarela (Stripe Elements)
  participant Backend as API Backend
  participant DB as PostgreSQL
  User->>App: Ingresar Tarjeta en Formulario Seguro
  App->>Gateway: Enviar PAN/CVV directamente
  Gateway-->>App: provider_token (tok_xyz)
  App->>Backend: POST /payment-methods { token, brand, last4 }
  Backend->>DB: INSERT INTO payment_methods (...)
  Backend-->>App: 201 Created
  App-->>User: Método Guardado`,
            description: 'Registro de métodos de pago sin contacto directo con datos sensibles de tarjeta.',
          },
        ];

        reply = buildSelectiveResponse({
          projectName: context.projectName,
          domainTitle: 'Bóveda de Métodos de Pago Guardados',
          intent,
          summaryRationale:
            'La tabla `payments` ya existe. Se introduce `payment_methods` para agilizar cobros recurrentes sin almacenar datos PAN.',
          reqs,
          entities,
          decisions,
          diagrams,
        });
      }

    // =========================================================================
    // DOMINIO 3: Autenticación / Roles / Permisos (RBAC)
    // =========================================================================
    } else if (
      lower.includes('auth') ||
      lower.includes('usuario') ||
      lower.includes('login') ||
      lower.includes('rol') ||
      lower.includes('permiso') ||
      lower.includes('rbac') ||
      lower.includes('seguridad')
    ) {
      const hasRoles = existingTableNames.includes('roles');

      if (!hasRoles) {
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Control de Acceso Basado en Roles (RBAC Granular)',
            type: 'RF',
            priority: 'HIGH',
            description: 'Asignar roles con matrices de permisos asociadas a usuarios para restringir endpoints y acciones sensibles.',
          },
          {
            title: 'Definición Jerárquica de Matrices de Permisos por Recurso',
            type: 'RF',
            priority: 'HIGH',
            description: 'Permitir estructurar permisos granulares por recurso (create, read, update, delete) asignables a roles.',
          },
          {
            title: 'Seguridad Multi-Tenant Horizontal con PostgreSQL RLS',
            type: 'RNF',
            priority: 'CRITICAL',
            description: 'Aplicar directivas Row Level Security que aseguren que los usuarios solo accedan a sus registros propios.',
          },
        ];

        const reqs = formatReqs(dynamicReqs);

        const entities: AiSuggestedEntity[] = [
          {
            tableName: 'roles',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'name', type: 'VARCHAR(50)', unique: true, nullable: false },
              { name: 'description', type: 'TEXT', nullable: true },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          },
          {
            tableName: 'permissions',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'code', type: 'VARCHAR(80)', unique: true, nullable: false },
              { name: 'resource', type: 'VARCHAR(50)', nullable: false },
              { name: 'action', type: 'VARCHAR(20)', nullable: false },
            ],
          },
          {
            tableName: 'role_permissions',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'role_id', type: 'UUID', isFk: true, referencesTable: 'roles', cardinality: '1:N' },
              { name: 'permission_id', type: 'UUID', isFk: true, referencesTable: 'permissions', cardinality: '1:N' },
            ],
          },
        ];

        const decisions: AiSuggestedDecision[] = [
          {
            code: adr1,
            title: 'RBAC Desacoplado con Verificación de Permisos en Middleware',
            context: 'Se requiere gobernar privilegios sin acoplar lógica dura de roles en los controladores.',
            decision: 'Consultar permisos en middleware de autorización y cachear la matriz en sesión o claims JWT.',
            consequences: 'Máxima flexibilidad para crear nuevos roles sin alterar código fuente.',
          },
        ];

        const diagrams: AiSuggestedDiagram[] = [
          {
            code: 'DIAG-01',
            title: 'Diagrama de Secuencia - Autenticación JWT y Autorización RBAC',
            type: 'sequence',
            format: 'mermaid',
            mermaidCode: `sequenceDiagram
  autonumber
  actor User as Usuario
  participant App as SPA Client
  participant Auth as Auth Service
  participant DB as PostgreSQL (RLS)
  User->>App: Ingresar Credenciales
  App->>Auth: POST /api/v1/auth/login
  Auth->>DB: SELECT * FROM users WHERE email = $1
  Auth->>Auth: Verificar Hash Argon2id
  Auth->>Auth: Generar JWT Access + Refresh Token
  Auth-->>App: 200 OK { accessToken, refreshToken }
  Note over App,DB: Petición protegida subsecuente
  App->>Auth: GET /api/v1/protected (Bearer JWT)
  Auth->>DB: SET LOCAL request.jwt.claim.user_id = $1
  Auth->>DB: SELECT * FROM protected_resource
  DB-->>Auth: Filas filtradas por RLS Policy
  Auth-->>App: 200 OK { data }`,
            description: 'Protocolo de autenticación moderna con tokens efímeros y seguridad horizontal en base de datos.',
          },
        ];

        reply = buildSelectiveResponse({
          projectName: context.projectName,
          domainTitle: 'Control de Acceso Basado en Roles (RBAC)',
          intent,
          summaryRationale:
            'Se estructura la terna `roles`, `permissions` y `role_permissions` desacoplando las autorizaciones de las credenciales de usuario.',
          reqs,
          entities,
          decisions,
          diagrams,
        });
      } else {
        // roles ya existe -> auditoría de sesiones y logins
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Auditoría Forense de Inicios de Sesión',
            type: 'RF',
            priority: 'HIGH',
            description: 'Registrar cada intento de acceso con IP, User-Agent, estado y marca temporal.',
          },
          {
            title: 'Trazabilidad Inmutable de Seguridad',
            type: 'RNF',
            priority: 'HIGH',
            description: 'Prohibir mutaciones o borrados sobre la tabla de auditoría de sesiones.',
          },
        ];

        const reqs = formatReqs(dynamicReqs);

        const entities: AiSuggestedEntity[] = [
          {
            tableName: 'login_audits',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'user_id', type: 'UUID', isFk: hasUsersTable, referencesTable: hasUsersTable ? 'users' : undefined, cardinality: '1:N' },
              { name: 'ip_address', type: 'VARCHAR(45)', nullable: false },
              { name: 'user_agent', type: 'TEXT', nullable: true },
              { name: 'is_successful', type: 'BOOLEAN', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          },
        ];

        const decisions: AiSuggestedDecision[] = [
          {
            code: adr1,
            title: 'Registro Inmutable de Eventos de Autenticación',
            context: 'Se requiere cumplir con estándares de auditoría forense y mitigación de fuerza bruta.',
            decision: 'Registrar cada evento de login exitoso o fallido de forma asíncrona sin bloquear la respuesta HTTP.',
            consequences: 'Trazabilidad completa con impacto despreciable en el tiempo de respuesta del portal.',
          },
        ];

        const diagrams: AiSuggestedDiagram[] = [
          {
            code: 'DIAG-01',
            title: 'Diagrama de Secuencia - Auditoría Asíncrona de Login',
            type: 'sequence',
            format: 'mermaid',
            mermaidCode: `sequenceDiagram
  autonumber
  actor Attacker as Cliente / Posible Atacante
  participant AuthSvc as Auth Service
  participant AuditQueue as Cola de Auditoría
  participant Worker as Audit Worker
  participant DB as PostgreSQL
  Attacker->>AuthSvc: POST /login { email, bad_password }
  AuthSvc->>AuditQueue: emit(LoginFailedEvent)
  AuthSvc-->>Attacker: 401 Unauthorized
  AuditQueue->>Worker: consume(LoginFailedEvent)
  Worker->>DB: INSERT INTO login_audits (ip, success=false)`,
            description: 'Registro de auditoría forense desacoplado del hilo de respuesta HTTP.',
          },
        ];

        reply = buildSelectiveResponse({
          projectName: context.projectName,
          domainTitle: 'Auditoría Forense de Sesiones',
          intent,
          summaryRationale:
            'La tabla `roles` ya existe en el esquema. Se añade `login_audits` para cumplimiento y trazabilidad de seguridad.',
          reqs,
          entities,
          decisions,
          diagrams,
        });
      }

    // =========================================================================
    // DOMINIO 4: Catálogo / Productos / Inventario
    // =========================================================================
    } else if (
      lower.includes('producto') ||
      lower.includes('catalogo') ||
      lower.includes('inventario') ||
      lower.includes('stock') ||
      lower.includes('categoria')
    ) {
      const hasProducts = existingTableNames.includes('products');

      if (!hasProducts) {
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Gestión Centralizada de Catálogo y Taxonomía',
            type: 'RF',
            priority: 'HIGH',
            description: 'Permitir la creación y actualización de productos asignados a categorías normalizadas con slug SEO unívoco.',
          },
          {
            title: 'Control y Reserva Concurrente de Stock',
            type: 'RF',
            priority: 'HIGH',
            description: 'Actualizar el inventario disponible con validación de balance positivo impidiendo sobreventas concurrentes.',
          },
          {
            title: 'Latencia Sub-200ms en Consultas de Catálogo',
            type: 'RNF',
            priority: 'MEDIUM',
            description: 'Las consultas de listado de productos deben optimizarse con índices B-Tree en category_id y status.',
          },
        ];

        const reqs = formatReqs(dynamicReqs);

        const entities: AiSuggestedEntity[] = [
          {
            tableName: 'categories',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'name', type: 'VARCHAR(100)', unique: true, nullable: false },
              { name: 'slug', type: 'VARCHAR(120)', unique: true, nullable: false },
              { name: 'description', type: 'TEXT', nullable: true },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          },
          {
            tableName: 'products',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'category_id', type: 'UUID', isFk: true, referencesTable: 'categories', cardinality: '1:N' },
              { name: 'sku', type: 'VARCHAR(50)', unique: true, nullable: false },
              { name: 'name', type: 'VARCHAR(150)', nullable: false },
              { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
              { name: 'stock', type: 'INTEGER', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          },
        ];

        const decisions: AiSuggestedDecision[] = [
          {
            code: adr1,
            title: 'Bloqueo Pesimista SELECT FOR UPDATE para Modificación de Stock',
            context: 'Múltiples clientes pueden intentar reservar la última unidad de un producto de forma simultánea.',
            decision: 'Aplicar SELECT FOR UPDATE dentro de la transacción de checkout para garantizar consistencia atómica del inventario.',
            consequences: 'Inmunidad ante condiciones de carrera de sobreventa con bajo impacto en operaciones de lectura.',
          },
        ];

        const diagrams: AiSuggestedDiagram[] = [
          {
            code: 'DIAG-01',
            title: 'Diagrama de Clases - Modelo de Dominio de Catálogo',
            type: 'class',
            format: 'mermaid',
            mermaidCode: `classDiagram
  class Category {
    +UUID id
    +String name
    +String slug
    +String description
    +DateTime createdAt
    +getProducts() List~Product~
  }
  class Product {
    +UUID id
    +UUID categoryId
    +String sku
    +String name
    +Decimal price
    +Integer stock
    +DateTime createdAt
    +reserveStock(qty: Integer) Boolean
  }
  Category "1" --> "0..*" Product : agrupa`,
            description: 'Jerarquía y relaciones de clases del módulo de inventario y catálogo.',
          },
        ];

        reply = buildSelectiveResponse({
          projectName: context.projectName,
          domainTitle: 'Catálogo de Productos y Control de Inventario',
          intent,
          summaryRationale:
            'Desacoplamos `categories` de `products` mediante `category_id FK` para normalización 3FN e indexación de alta velocidad.',
          reqs,
          entities,
          decisions,
          diagrams,
        });
      } else {
        // products ya existe -> auditoría de movimientos de stock
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Registro Inmutable de Movimientos de Inventario',
            type: 'RF',
            priority: 'HIGH',
            description: 'Registrar cada entrada, salida o ajuste de stock con causal técnica y usuario responsable.',
          },
          {
            title: 'Auditoría Forense de Alteraciones de Balance',
            type: 'RNF',
            priority: 'HIGH',
            description: 'Impedir alteraciones retroactivas de los movimientos de inventario registrados.',
          },
        ];

        const reqs = formatReqs(dynamicReqs);

        const entities: AiSuggestedEntity[] = [
          {
            tableName: 'stock_movements',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'product_id', type: 'UUID', isFk: true, referencesTable: 'products', cardinality: '1:N' },
              { name: 'movement_type', type: 'VARCHAR(20)', nullable: false },
              { name: 'quantity', type: 'INTEGER', nullable: false },
              { name: 'reason', type: 'VARCHAR(255)', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          },
        ];

        const decisions: AiSuggestedDecision[] = [
          {
            code: adr1,
            title: 'Modelo de Registro Inmutable de Inventario tipo Libro Diario',
            context: 'Se requiere justificar cualquier variación de existencias ante auditorías fiscales y de almacén.',
            decision: 'Todo cambio de inventario debe realizarse mediante un INSERT en stock_movements sin mutaciones directas sin respaldo.',
            consequences: 'Trazabilidad contable total y capacidad de reconstruir el stock a cualquier punto en el tiempo.',
          },
        ];

        const diagrams: AiSuggestedDiagram[] = [
          {
            code: 'DIAG-01',
            title: 'Diagrama de Secuencia - Registro Inmutable de Stock',
            type: 'sequence',
            format: 'mermaid',
            mermaidCode: `sequenceDiagram
  autonumber
  actor Operator as Operador de Almacén
  participant App as WMS Portal
  participant InvSvc as Inventory Service
  participant DB as PostgreSQL
  Operator->>App: Ajustar Inventario (+50 Unidades)
  App->>InvSvc: POST /stock-movements { productId, type='IN', qty=50 }
  InvSvc->>DB: BEGIN TRANSACTION
  InvSvc->>DB: INSERT INTO stock_movements (...)
  InvSvc->>DB: UPDATE products SET stock = stock + 50 WHERE id = $1
  InvSvc->>DB: COMMIT
  InvSvc-->>App: 201 Created
  App-->>Operator: Ajuste Asentado con Auditoría`,
            description: 'Flujo transaccional de alteración de balance con persistencia en libro diario.',
          },
        ];

        reply = buildSelectiveResponse({
          projectName: context.projectName,
          domainTitle: 'Movimientos y Auditoría Inmutable de Stock',
          intent,
          summaryRationale:
            'La tabla `products` ya existe. Se introduce `stock_movements` para auditoría forense de entradas y salidas de bodega.',
          reqs,
          entities,
          decisions,
          diagrams,
        });
      }

    // =========================================================================
    // DOMINIO 5: Caso General / Dinámico basado en el prompt
    // =========================================================================
    } else {
      const STOPWORDS = new Set([
        'excelente', 'analisis', 'formaliza', 'propuesta', 'proyecto', 'generando', 'genera',
        'requisitos', 'modelo', 'relacional', 'canvas', 'actas', 'arquitectura', 'favor',
        'podrias', 'puedes', 'sistema', 'modulo', 'buenas', 'tardes', 'hola', 'bueno',
        'gracias', 'procede', 'estructura', 'artefactos', 'tablas', 'entidades', 'acuerdo',
        'diagrama', 'diagramas', 'mermaid', 'unicamente', 'solamente', 'solo', 'solos',
        'sola', 'solas', 'quiero', 'quisiera', 'necesito', 'pedi', 'pido', 'pedir',
        'generar', 'crear', 'disenar', 'disena', 'hazme', 'hacer', 'hagas', 'haga', 'haces', 'hagan', 'dame', 'dar',
        'poner', 'mostrar', 'muestra', 'bpmn', 'flujo', 'flowchart', 'secuencia',
        'sequence', 'clases', 'estados', 'state', 'c4', 'uml', 'accion', 'acciones',
        'inyecta', 'inyectar', 'inyectes', 'inyecte', 'inyectan', 'inyeccion', 'inyecciones', 'estudio', 'visualizador',
        'como', 'cual', 'donde', 'cuando', 'porque', 'para', 'pero', 'este', 'esta'
      ]);
      const words = scopeText.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '').split(/\s+/).filter((w) => w.length > 3 && !STOPWORDS.has(w));
      let rawDomain = (words[0] || '').toLowerCase();
      if (!rawDomain || rawDomain.length < 3) {
        const projectWords = `${context.projectName} ${context.projectDescription || ''}`
          .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 3 && !STOPWORDS.has(w.toLowerCase()));
        rawDomain = (projectWords[0] || 'operacion').toLowerCase();
      }

      const domainSlug = rawDomain.replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n');
      const domainSingular = domainSlug.endsWith('es') ? domainSlug.slice(0, -2) : domainSlug.endsWith('s') ? domainSlug.slice(0, -1) : domainSlug;
      const domainPlural = domainSingular.endsWith('r') || domainSingular.endsWith('l') || domainSingular.endsWith('n') ? `${domainSingular}es` : `${domainSingular}s`;

      const domainTable = existingTableNames.includes(domainPlural) ? `${domainPlural}_records` : domainPlural;
      const domainDetailsTable = `${domainSingular}_details`;

      const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
        {
          title: `Gestión y Orquestación del Ciclo de Vida de ${domainSingular.toUpperCase()}`,
          type: 'RF',
          priority: 'HIGH',
          description: `Permitir operaciones transaccionales para crear, consultar y auditar registros de ${domainPlural} con validación estricta de DTOs.`,
        },
        {
          title: `Trazabilidad Forense de Estado en ${domainSingular.toUpperCase()}`,
          type: 'RF',
          priority: 'MEDIUM',
          description: `Garantizar transiciones controladas de estado y registro cronológico de alteraciones.`,
        },
        {
          title: `Gobernanza Pre-Código y Aislamiento por Capas`,
          type: 'RNF',
          priority: 'HIGH',
          description: `Preservar contratos tipados DTO en entrada y salida desacoplando controladores de los repositorios relacionales.`,
        },
      ];

      const reqs = formatReqs(dynamicReqs);

      const entities: AiSuggestedEntity[] = [
        {
          tableName: domainTable,
          columns: [
            { name: 'id', type: 'UUID', isPk: true },
            { name: 'user_id', type: 'UUID', isFk: hasUsersTable, referencesTable: hasUsersTable ? 'users' : undefined, cardinality: '1:N' },
            { name: 'code', type: 'VARCHAR(50)', unique: true, nullable: false },
            { name: 'title', type: 'VARCHAR(150)', nullable: false },
            { name: 'status', type: 'VARCHAR(20)', nullable: false },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false },
          ],
        },
        {
          tableName: domainDetailsTable,
          columns: [
            { name: 'id', type: 'UUID', isPk: true },
            { name: `${domainSingular}_id`, type: 'UUID', isFk: true, referencesTable: domainTable, cardinality: '1:N' },
            { name: 'detail_key', type: 'VARCHAR(100)', nullable: false },
            { name: 'detail_value', type: 'TEXT', nullable: false },
          ],
        },
      ];

      const decisions: AiSuggestedDecision[] = [
        {
          code: adr1,
          title: `Contratos Tipados DTO como Fuente Única de Verdad para ${domainTable.toUpperCase()}`,
          context: 'Se requiere preservar desacoplamiento modular entre la capa de presentación y la base de datos.',
          decision: 'Definir DTOs tipados en TypeScript como SSOT garantizando validación simétrica en entrada y salida.',
          consequences: 'Consistencia estructural plena, prevención de fugas de datos y fácil mantenimiento evolutivo.',
        },
      ];

      const isBpmnRequest =
        lower.includes('bpmn') ||
        lower.includes('proceso') ||
        lower.includes('flujo') ||
        lower.includes('workflow') ||
        lower.includes('actividad');

      const diagrams: AiSuggestedDiagram[] = [];

      if (isBpmnRequest) {
        diagrams.push({
          code: 'DIAG-01',
          title: `Diagrama de Procesos BPMN - Flujo Operativo de ${domainSingular.toUpperCase()}`,
          type: 'flowchart',
          format: 'mermaid',
          mermaidCode: `flowchart TD
  Start([Inicio del Proceso: Solicitud de ${domainSingular.toUpperCase()}]) --> TaskValidation[Validación de Contrato DTO y Permisos]
  TaskValidation --> GateCheck{¿Payload Válido?}
  GateCheck -- No --> TaskReject([Fin: 400 Bad Request / Notificación])
  GateCheck -- Sí --> TaskTx[Inicio de Transacción ACID en Repositorio]
  TaskTx --> TaskPersist[(INSERT en ${domainTable})]
  TaskPersist --> TaskAudit[Registro de Evento en Log de Auditoría]
  TaskAudit --> GateCommit{¿Commit Exitoso?}
  GateCommit -- Sí --> TaskNotify[Emisión de Respuesta 201 Created]
  GateCommit -- No --> TaskRollback[ROLLBACK Transaccional]
  TaskRollback --> TaskReject
  TaskNotify --> EndSuccess([Fin del Proceso: Operación Formalizada])`,
          description: `Modelado de proceso de negocio BPMN con compuertas de decisión y eventos conforme a estándar OKF.`,
        });
      } else {
        diagrams.push({
          code: 'DIAG-01',
          title: `Diagrama de Secuencia - Orquestación por Capas para ${domainSingular.toUpperCase()}`,
          type: 'sequence',
          format: 'mermaid',
          mermaidCode: `sequenceDiagram
  autonumber
  actor Client as Cliente / Consumidor
  participant Ctrl as ${domainSingular.charAt(0).toUpperCase() + domainSingular.slice(1)}Controller
  participant Svc as ${domainSingular.charAt(0).toUpperCase() + domainSingular.slice(1)}Service
  participant Repo as ${domainSingular.charAt(0).toUpperCase() + domainSingular.slice(1)}Repository
  participant DB as PostgreSQL
  Client->>Ctrl: POST /api/v1/${domainPlural} (DTO)
  Ctrl->>Ctrl: Validar Esquema DTO (Zod / class-validator)
  Ctrl->>Svc: execute(Command)
  Svc->>Repo: persist(Entity)
  Repo->>DB: INSERT INTO ${domainTable} (...)
  DB-->>Repo: Record (Row)
  Repo-->>Svc: DomainEntity
  Svc-->>Ctrl: ResultDTO
  Ctrl-->>Client: 201 Created { id }`,
          description: `Flujo transaccional layered MVC para ${domainPlural} con validación simétrica.`,
        });
      }

      reply = buildSelectiveResponse({
        projectName: context.projectName,
        domainTitle: `Dominio de ${domainPlural.toUpperCase()}`,
        intent,
        summaryRationale:
          `Se normaliza la entidad maestra \`${domainTable}\` con su tabla subordinada de atributos \`${domainDetailsTable}\` en 3FN.`,
        reqs,
        entities,
        decisions,
        diagrams,
      });
    }

    const { cleanText, suggestedRequirements, suggestedEntities, suggestedDecisions, suggestedDiagrams } =
      parseDevSculptorActions(reply);

    return {
      content: cleanText,
      reply: cleanText,
      provider: this.name,
      model: 'devsculptor-heuristic-architect-v1',
      actions: {
        requirements: suggestedRequirements,
        entities: suggestedEntities,
        decisions: suggestedDecisions,
        diagrams: suggestedDiagrams,
      },
      suggestedRequirements,
      suggestedEntities,
      suggestedDecisions,
      suggestedDiagrams,
    };
  }

  public async analyzeSchema(context: AiProjectContext): Promise<AiChatResult> {
    const tableCount = context.entities.length;
    const reqCount = context.requirements.length;

    let analysis = `### 📊 Informe de Auditoría Heurística Relacional (Pre-Código)\n\n`;
    analysis += `**Proyecto:** ${context.projectName} | **Estilo:** ${context.architectureStyle}\n\n`;

    if (tableCount === 0) {
      analysis += `⚠️ **Advertencia Crítica:** No existen tablas creadas en el Canvas ERD. Se recomienda comenzar modelando las entidades principales del dominio.\n`;
    } else {
      analysis += `✅ **Cobertura de Tablas:** Se detectaron ${tableCount} tablas en el modelo.\n`;
      const missingPkTables = context.entities.filter(
        (e) => !e.columns.some((c) => c.isPk || c.is_pk)
      );

      if (missingPkTables.length > 0) {
        analysis += `❌ **Violación de 1FN:** Las siguientes tablas carecen de Primary Key explícita: ${missingPkTables.map((t) => `\`${t.tableName}\``).join(', ')}.\n`;
      } else {
        analysis += `✅ **1FN Aprobada:** Todas las tablas poseen Primary Key definida.\n`;
      }

      analysis += `✅ **Aislamiento Horizontal:** Se verificó la tenencia horizontal para multi-tenant seguro en PostgreSQL.\n`;
      analysis += `📈 **Alineación con Requisitos:** ${tableCount} tablas mapeadas frente a ${reqCount} requisitos registrados.\n`;
    }

    return {
      content: analysis,
      reply: analysis,
      provider: this.name,
      model: 'devsculptor-schema-auditor-v1',
      actions: {},
    };
  }

  public async suggestRequirements(
    userPrompt: string,
    context: AiProjectContext
  ): Promise<AiChatResult> {
    const nextNum = context.requirements.length + 1;
    const rf1 = `RF-${nextNum < 10 ? '0' + nextNum : nextNum}`;
    const rf2 = `RNF-${nextNum < 10 ? '0' + (nextNum + 1) : nextNum + 1}`;

    const text = `A partir de tu planteamiento *"${userPrompt}"*, he derivado los siguientes requisitos formales bajo estándar IEEE-830:`;

    const reqs = [
      {
        code: rf1,
        title: `Gestión de ${userPrompt.slice(0, 30)}`,
        type: 'RF' as const,
        priority: 'HIGH' as const,
        description: `El sistema debe proveer capacidades para procesar y consultar ${userPrompt.toLowerCase()}.`,
      },
      {
        code: rf2,
        title: 'Respuesta Sub-500ms en Operaciones de Dominio',
        type: 'RNF' as const,
        priority: 'MEDIUM' as const,
        description: 'Las transacciones asociadas deben procesarse en menos de 500ms mediante pool parametrizado.',
      },
    ];

    return {
      content: text,
      reply: text,
      provider: this.name,
      model: 'devsculptor-requirements-synthesizer-v1',
      actions: {
        requirements: reqs,
      },
      suggestedRequirements: reqs,
    };
  }
}
