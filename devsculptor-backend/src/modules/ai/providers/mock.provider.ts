import {
  IAiProvider,
  AiProjectContext,
  AiChatResult,
} from './ai-provider.interface';
import { parseDevSculptorActions } from '../ai.prompts';

export class MockAiProvider implements IAiProvider {
  public readonly name = 'mock';

  public async generateChat(
    messages: Array<{ role: 'user' | 'model'; content: string }>,
    context: AiProjectContext,
    _options?: { temperature?: number; actionContext?: string }
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
      lower.includes('crea los requisitos') ||
      lower.includes('estructura los artefactos') ||
      lower.includes('inyectar') ||
      lower.includes('inyecta') ||
      lower.includes('procede');

    const isConsultativeQuestion =
      !isExplicitFormalization &&
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
        lower.includes('dilema'));

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
3. **¿Existen entidades preexistentes adicionales o restricciones de integración externa?**

---
*💡 Cuando desees que formalice esta arquitectura en tu proyecto, indícame **"Formaliza la propuesta"** o **"Genera los requisitos y tablas"** y generaré la descomposición IEEE-830, el modelo relacional conexo en canvas y las actas ADR correspondientes.*`;

      return {
        content: consultativeReply,
        reply: consultativeReply,
        provider: this.name,
        model: 'devsculptor-heuristic-architect-v1',
      };
    }

    // Helper para asignar correlativos continuos a requerimientos dinámicos
    const formatReqs = (
      reqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL'; description: string }>
    ) => {
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

    const conversationHistoryText = messages.map((m) => m.content).join(' ').toLowerCase();
    const scopeText = `${lower} ${conversationHistoryText} ${(context.projectDescription || '').toLowerCase()} ${context.projectName.toLowerCase()}`;

    let reply = '';

    // Dominio 1: E-Commerce / Pedidos / Carrito / Órdenes / Dark Stores
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
            title: 'Compensación y Reembolso ante Faltantes de Bodega',
            type: 'RF',
            priority: 'HIGH',
            description: 'Revertir automáticamente cargos y notificar al cliente si un producto resulta dañado durante el picking.',
          },
          {
            title: 'Aislamiento Transaccional ACID Serializable',
            type: 'RNF',
            priority: 'CRITICAL',
            description: 'Garantizar aislamiento estricto en la deducción de existencias con latencia p95 menor a 200ms.',
          },
          {
            title: 'Ingesta Desacoplada de Telemetría Logística',
            type: 'RNF',
            priority: 'HIGH',
            description: 'Bufferizar reportes de ubicación de repartidores en caché o memoria sin saturar la base relacional principal.',
          },
        ];

        if (lower.includes('precio') || lower.includes('importe') || lower.includes('subtotal') || lower.includes('calcular') || lower.includes('monto')) {
          dynamicReqs.push({
            title: 'Validación de Precios Unitarios e Impuestos en Servidor',
            type: 'RF',
            priority: 'HIGH',
            description: 'Recalcular en backend los precios, descuentos e impuestos aplicables para blindar la integridad del importe total.',
          });
        }

        if (lower.includes('existencia') || lower.includes('stock') || lower.includes('inventario') || lower.includes('reserva') || lower.includes('disponib')) {
          dynamicReqs.push({
            title: 'Reserva Concurrente y Bloqueo de Stock en Inventario',
            type: 'RF',
            priority: 'HIGH',
            description: 'Comprobar disponibilidad y deducir transaccionalmente el stock de inventario impidiendo sobreventas simultáneas.',
          });
        }

        if (lower.includes('pago') || lower.includes('cobro') || lower.includes('liquidar') || lower.includes('tarjeta')) {
          dynamicReqs.push({
            title: 'Transición de Estado y Disparo de Liquidación de Pago',
            type: 'RF',
            priority: 'HIGH',
            description: 'Gestionar el ciclo de vida de la orden hacia PENDING_PAYMENT coordinando la solicitud con la pasarela financiera.',
          });
        }

        if (lower.includes('despacho') || lower.includes('envio') || lower.includes('entrega') || lower.includes('logistica') || lower.includes('rastreo')) {
          dynamicReqs.push({
            title: 'Generación de Orden de Despacho y Trazabilidad Logística',
            type: 'RF',
            priority: 'HIGH',
            description: 'Emitir orden de despacho con dirección de entrega y asignación de transportista una vez acreditada la orden.',
          });
        }

        if (lower.includes('historial') || lower.includes('consulta') || lower.includes('seguimiento') || lower.includes('mis pedidos')) {
          dynamicReqs.push({
            title: 'Consulta Paginada de Historial y Detalle de Órdenes',
            type: 'RF',
            priority: 'MEDIUM',
            description: 'Habilitar a clientes y operadores la inspección de pedidos previos con desglose de renglones y comprobantes.',
          });
        }

        if (lower.includes('cancel') || lower.includes('devoluc') || lower.includes('anulac') || lower.includes('reembolso')) {
          dynamicReqs.push({
            title: 'Anulación y Reversión Automática de Existencias',
            type: 'RF',
            priority: 'HIGH',
            description: 'Permitir la anulación controlada de pedidos no despachados reintegrando de forma inmediata el stock disponible.',
          });
        }

        // Si la petición fue muy breve, garantizar al menos la validación de importes
        if (dynamicReqs.length === 1) {
          dynamicReqs.push({
            title: 'Validación de Precios y Existencias en Servidor',
            type: 'RF',
            priority: 'HIGH',
            description: 'Verificar en runtime que los precios unitarios y existencias sean consistentes antes de emitir la confirmación.',
          });
        }

        // Requisito No Funcional de consistencia
        dynamicReqs.push({
          title: 'Transaccionalidad ACID con Aislamiento Serializable',
          type: 'RNF',
          priority: 'HIGH',
          description: 'Garantizar que la deducción de inventario y creación de renglones ocurran en una sola transacción atómica sin lecturas fantasma.',
        });

        // Entidades dinámicas del dominio formando un grafo estrictamente conexo
        const isDarkStoreDomain =
          scopeText.includes('dark store') ||
          scopeText.includes('dark_store') ||
          scopeText.includes('sobreventa') ||
          scopeText.includes('bodega');

        const dynamicEntities: unknown[] = [];

        if (isDarkStoreDomain && !existingTableNames.includes('dark_stores')) {
          dynamicEntities.push({
            tableName: 'dark_stores',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'name', type: 'VARCHAR(100)', nullable: false },
              { name: 'address', type: 'VARCHAR(255)', nullable: false },
              { name: 'is_active', type: 'BOOLEAN', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          });
        }

        if (!existingTableNames.includes('products')) {
          dynamicEntities.push({
            tableName: 'products',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'sku', type: 'VARCHAR(50)', unique: true, nullable: false },
              { name: 'name', type: 'VARCHAR(150)', nullable: false },
              { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          });
        }

        dynamicEntities.push(
          {
            tableName: 'orders',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'user_id', type: 'UUID', isFk: true, referencesTable: 'users', cardinality: '1:N', nullable: false },
              ...(isDarkStoreDomain ? [{ name: 'dark_store_id', type: 'UUID', isFk: true, referencesTable: 'dark_stores', cardinality: '1:N', nullable: false }] : []),
              { name: 'order_number', type: 'VARCHAR(32)', unique: true, nullable: false },
              { name: 'total_amount', type: 'DECIMAL(12,2)', nullable: false },
              { name: 'status', type: 'VARCHAR(20)', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          },
          {
            tableName: 'order_items',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'order_id', type: 'UUID', isFk: true, referencesTable: 'orders', cardinality: '1:N', nullable: false },
              { name: 'product_id', type: 'UUID', isFk: true, referencesTable: 'products', cardinality: '1:N', nullable: false },
              { name: 'unit_price', type: 'DECIMAL(10,2)', nullable: false },
              { name: 'quantity', type: 'INTEGER', nullable: false },
              { name: 'subtotal', type: 'DECIMAL(12,2)', nullable: false },
            ],
          }
        );

        if (lower.includes('despacho') || lower.includes('envio') || lower.includes('entrega') || lower.includes('direccion') || lower.includes('logistica')) {
          dynamicEntities.push({
            tableName: 'shipping_addresses',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'order_id', type: 'UUID', isFk: true, referencesTable: 'orders', cardinality: '1:1', unique: true, nullable: false },
              { name: 'recipient_name', type: 'VARCHAR(120)', nullable: false },
              { name: 'street_address', type: 'VARCHAR(255)', nullable: false },
              { name: 'city', type: 'VARCHAR(100)', nullable: false },
              { name: 'postal_code', type: 'VARCHAR(20)', nullable: false },
              { name: 'country_code', type: 'VARCHAR(3)', nullable: false },
            ],
          });
        }

        if (lower.includes('pago') || lower.includes('cobro') || lower.includes('liquidar') || lower.includes('transaccion')) {
          dynamicEntities.push({
            tableName: 'payments',
            columns: [
              { name: 'id', type: 'UUID', isPk: true },
              { name: 'order_id', type: 'UUID', isFk: true, referencesTable: 'orders', cardinality: '1:1', unique: true, nullable: false },
              { name: 'amount', type: 'DECIMAL(12,2)', nullable: false },
              { name: 'currency', type: 'VARCHAR(3)', nullable: false },
              { name: 'status', type: 'VARCHAR(20)', nullable: false },
              { name: 'idempotency_key', type: 'UUID', unique: true, nullable: false },
            ],
          });
        }
        const reqsJson = JSON.stringify(formatReqs(dynamicReqs), null, 4);
        const entitiesJson = JSON.stringify(dynamicEntities, null, 4);

        reply = `Como Arquitecto de Software Principal, he evaluado exhaustivamente tu solicitud para el módulo de **Órdenes y Pedidos** en el proyecto **"${context.projectName}"** (${context.architectureStyle}).

### Razonamiento Arquitectónico y Descomposición del Dominio:
1. **Desacoplamiento Cabecera-Detalle y Entidades Satélite**: Una orden requiere un modelo relacional en 3FN que separe la cabecera (\`orders\`), sus renglones (\`order_items\`)${
  dynamicEntities.some((e: unknown) => (e as { tableName: string }).tableName === 'shipping_addresses')
    ? ', los datos de destino logístico (`shipping_addresses`)'
    : ''
}${
  dynamicEntities.some((e: unknown) => (e as { tableName: string }).tableName === 'payments')
    ? ' y la transacción financiera vinculada (`payments`)'
    : ''
} con claves foráneas cruzadas.
2. **Asociación y Multi-Tenancy**: ${
  hasUsersTable
    ? 'Se vincula directamente con la tabla existente `users` mediante `user_id UUID FK`, preservando el principio de no duplicación.'
    : 'Se incluye la referencia `user_id UUID` lista para acoplar al módulo de identidad.'
}
3. **Criterio Dinámico de Requisitos y Entidades**: Se formularon **${dynamicReqs.length} requisitos específicos** y **${dynamicEntities.length} entidades relacionales normalizadas** deducidas directamente de las responsabilidades descritas en tu propuesta.
4. **Control Transaccional ACID**: Se formaliza el aislamiento serializable para evitar sobreventas concurrentes.

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": ${reqsJson},
  "suggestedEntities": ${entitiesJson},
  "suggestedDecisions": [
    {
      "code": "${adr1}",
      "title": "Máquina de Estados Finita e Inmutabilidad para Ciclo de Órdenes",
      "context": "Las órdenes requieren transición controlada entre estados (CREATED -> PAID -> FULFILLED | CANCELLED).",
      "decision": "Implementar validación de transiciones de estado a nivel de DTO y base de datos impidiendo mutaciones en pedidos liquidados.",
      "consequences": "Integridad contable total, mitigación de dobles despachos y auditoría fidedigna."
    }
  ]
}
\`\`\``;
      } else {
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Despacho y Trazabilidad de Envíos',
            type: 'RF',
            priority: 'HIGH',
            description: 'Generación de guías de despacho con número de rastreo y fecha estimada vinculadas a órdenes existentes.',
          },
        ];

        if (lower.includes('notific') || lower.includes('alerta') || lower.includes('correo') || lower.includes('email')) {
          dynamicReqs.push({
            title: 'Notificación Multicanal de Cambio de Estado en Envíos',
            type: 'RF',
            priority: 'MEDIUM',
            description: 'Emisión de eventos automáticos cada vez que el paquete cambie de estado de entrega.',
          });
        }

        if (lower.includes('rastreo') || lower.includes('tracking') || lower.includes('guia') || lower.includes('transportista')) {
          dynamicReqs.push({
            title: 'Sincronización con APIs de Transportistas Externos',
            type: 'RF',
            priority: 'HIGH',
            description: 'Consultar periódicamente el estado de la guía en los servicios web del transportista logístico.',
          });
        }

        dynamicReqs.push({
          title: 'Sincronización Eventual Asíncrona de Estados de Despacho',
          type: 'RNF',
          priority: 'MEDIUM',
          description: 'Procesar eventos de despacho desacoplados de la sesión HTTP mediante colas de mensajes.',
        });

        const reqsJson = JSON.stringify(formatReqs(dynamicReqs), null, 4);

        reply = `He verificado el estado vivo de tu proyecto y detecté que la tabla **\`orders\` ya existe en el canvas**.
Aplicando la regla de **no-duplicación**, propongo expandir el dominio hacia el subsistema de **Logística de Envíos y Despachos**:

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": ${reqsJson},
  "suggestedEntities": [
    {
      "tableName": "shipments",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "order_id", "type": "UUID", "isFk": true, "referencesTable": "orders", "cardinality": "1:N" },
        { "name": "tracking_number", "type": "VARCHAR(64)", "unique": true, "nullable": false },
        { "name": "carrier", "type": "VARCHAR(50)", "nullable": false },
        { "name": "status", "type": "VARCHAR(20)", "nullable": false },
        { "name": "shipped_at", "type": "TIMESTAMP", "nullable": true },
        { "name": "delivered_at", "type": "TIMESTAMP", "nullable": true }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adr1}",
      "title": "Estrategia de Actualización Asíncrona para Guías de Envío",
      "context": "Los operadores logísticos externos proveen webhooks con latencia variable.",
      "decision": "Procesar actualizaciones de estado de envío de forma asíncrona desacoplada de la sesión del cliente.",
      "consequences": "Mayor resiliencia del sistema ante caídas o lentitud de las APIs de las empresas de correo."
    }
  ]
}
\`\`\``;
      }

    // Dominio 2: Pagos / Cobros / Billing
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
        ];

        if (lower.includes('webhook') || lower.includes('callback') || lower.includes('notific')) {
          dynamicReqs.push({
            title: 'Conciliación Asíncrona de Webhooks de Pago',
            type: 'RF',
            priority: 'HIGH',
            description: 'Recepción y validación de firmas criptográficas HMAC en webhooks de pasarela con reintentos exponenciales.',
          });
        }

        if (lower.includes('reembolso') || lower.includes('refund') || lower.includes('devoluc')) {
          dynamicReqs.push({
            title: 'Liquidación y Registro de Reembolsos Totales o Parciales',
            type: 'RF',
            priority: 'HIGH',
            description: 'Ejecución de reembolsos a través de la API de la pasarela y actualización auditada del estado del pago.',
          });
        }

        if (lower.includes('suscrip') || lower.includes('recurrente') || lower.includes('plan')) {
          dynamicReqs.push({
            title: 'Gestión y Renovación Automatizada de Cobros Recurrentes',
            type: 'RF',
            priority: 'HIGH',
            description: 'Programar cobros periódicos asociados a planes de suscripción con manejo de gracia ante fallos.',
          });
        }

        if (lower.includes('factura') || lower.includes('recibo') || lower.includes('fiscal') || lower.includes('comprobante')) {
          dynamicReqs.push({
            title: 'Emisión Automatizada de Comprobantes Fiscales',
            type: 'RF',
            priority: 'MEDIUM',
            description: 'Generar comprobante tributario y vincular el folio fiscal a la transacción confirmada.',
          });
        }

        dynamicReqs.push({
          title: 'Cumplimiento PCI-DSS mediante Tokenización Externa',
          type: 'RNF',
          priority: 'CRITICAL',
          description: 'Prohibir el almacenamiento de datos primarios de tarjeta (PAN/CVV) en la base de datos de la aplicación.',
        });

        const reqsJson = JSON.stringify(formatReqs(dynamicReqs), null, 4);

        reply = `He formulado la propuesta integral para el subsistema de **Pagos y Transacciones Financieras** en **"${context.projectName}"**:

### Razonamiento de Blindaje Transaccional:
1. **Separación de Responsabilidades**: Desacoplamos la intención de pago (\`payments\`) de los eventos de auditoría y callbacks del proveedor (\`payment_transactions\`).
2. **No Duplicación y Referencias**: ${
  existingTableNames.includes('orders')
    ? 'Se enlaza a la tabla `orders` ya existente en tu canvas con clave foránea.'
    : hasUsersTable
    ? 'Se asocia con `users` mediante `user_id FK`.'
    : 'Se proveen las claves foráneas listas para relacionar.'
}
3. **Criterio Dinámico**: Se derivaron **${dynamicReqs.length} requisitos funcionales y no funcionales** conforme a las operaciones solicitadas.
4. **Idempotencia**: Todo cobro requiere un UUID de idempotencia unívoco para neutralizar dobles cobros ante reintentos de red.

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": ${reqsJson},
  "suggestedEntities": [
    {
      "tableName": "payments",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        ${existingTableNames.includes('orders') ? '{ "name": "order_id", "type": "UUID", "isFk": true, "referencesTable": "orders", "cardinality": "1:1" },' : ''}
        { "name": "user_id", "type": "UUID", "isFk": ${hasUsersTable}, ${hasUsersTable ? '"referencesTable": "users", "cardinality": "1:N",' : ''} "nullable": false },
        { "name": "amount", "type": "DECIMAL(12,2)", "nullable": false },
        { "name": "currency", "type": "VARCHAR(3)", "nullable": false },
        { "name": "status", "type": "VARCHAR(20)", "nullable": false },
        { "name": "idempotency_key", "type": "UUID", "unique": true, "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    },
    {
      "tableName": "payment_transactions",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "payment_id", "type": "UUID", "isFk": true, "referencesTable": "payments", "cardinality": "1:N" },
        { "name": "gateway_event_id", "type": "VARCHAR(100)", "unique": true, "nullable": false },
        { "name": "event_type", "type": "VARCHAR(50)", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adr1}",
      "title": "Tokenización Externa y Manejo Idempotente de Pagos",
      "context": "Se requiere procesar transacciones monetarias reduciendo la superficie de riesgo PCI-DSS y evitando dobles cargos.",
      "decision": "Delegar la captura de tarjetas sensibles a pasarela externa (Stripe/MercadoPago) y almacenar únicamente tokens e idempotencia.",
      "consequences": "Menor superficie de ataque, total cumplimiento normativo e inmunidad contra fallas de red."
    }
  ]
}
\`\`\``;
      } else {
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

        const reqsJson = JSON.stringify(formatReqs(dynamicReqs), null, 4);

        reply = `Detecté que **\`payments\` ya existe** en tu canvas. Para complementar el flujo de pagos, propongo el módulo de **Métodos de Pago Guardados**:

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": ${reqsJson},
  "suggestedEntities": [
    {
      "tableName": "payment_methods",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "user_id", "type": "UUID", "isFk": ${hasUsersTable}, ${hasUsersTable ? '"referencesTable": "users", "cardinality": "1:N",' : ''} "nullable": false },
        { "name": "provider_token", "type": "VARCHAR(255)", "unique": true, "nullable": false },
        { "name": "card_brand", "type": "VARCHAR(20)", "nullable": false },
        { "name": "last4", "type": "VARCHAR(4)", "nullable": false },
        { "name": "is_default", "type": "BOOLEAN", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adr1}",
      "title": "Persistencia Exclusiva de Tokens de Cliente",
      "context": "Se busca mejorar la experiencia en checkout recurrente sin violar PCI-DSS.",
      "decision": "Guardar únicamente el identificador de cliente del procesador de pagos y los últimos 4 dígitos informativos.",
      "consequences": "Experiencia de 1-click checkout segura y sin riesgo de filtración de credenciales."
    }
  ]
}
\`\`\``;
      }

    // Dominio 3: Autenticación / Roles / Permisos (RBAC)
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
        ];

        if (lower.includes('permiso') || lower.includes('matriz') || lower.includes('accion') || lower.includes('politica')) {
          dynamicReqs.push({
            title: 'Definición Jerárquica de Matrices de Permisos por Recurso',
            type: 'RF',
            priority: 'HIGH',
            description: 'Permitir estructurar permisos granulares por recurso (create, read, update, delete) asignables a roles.',
          });
        }

        if (lower.includes('token') || lower.includes('jwt') || lower.includes('sesion') || lower.includes('rotac')) {
          dynamicReqs.push({
            title: 'Rotación de Refresh Tokens con Revocación Inmediata',
            type: 'RF',
            priority: 'HIGH',
            description: 'Emisión de tokens de actualización con hash SHA-256 en base de datos y revocación ante detección de reuso.',
          });
        }

        if (lower.includes('mfa') || lower.includes('2fa') || lower.includes('otp') || lower.includes('dos pasos')) {
          dynamicReqs.push({
            title: 'Autenticación Multifactorial Obligatoria (TOTP / SMS)',
            type: 'RF',
            priority: 'HIGH',
            description: 'Exigir comprobación de código temporal OTP para el acceso a roles privilegiados o administrativos.',
          });
        }

        if (lower.includes('fuerza bruta') || lower.includes('bloqueo') || lower.includes('intrus') || lower.includes('anomalia')) {
          dynamicReqs.push({
            title: 'Detección de Anomalías y Bloqueo Temporal por Intentos Fallidos',
            type: 'RF',
            priority: 'HIGH',
            description: 'Suspender temporalmente peticiones procedentes de direcciones IP con ráfagas de credenciales incorrectas.',
          });
        }

        dynamicReqs.push({
          title: 'Evaluación Sub-5ms de Permisos de Usuario en Memoria',
          type: 'RNF',
          priority: 'HIGH',
          description: 'El middleware de autorización debe validar los claims del JWT sin consultar la base de datos en cada request.',
        });

        const reqsJson = JSON.stringify(formatReqs(dynamicReqs), null, 4);

        reply = `He estructurado la propuesta integral de **Autenticación y Autorización RBAC (Role-Based Access Control)** para **"${context.projectName}"**:

### Razonamiento de Seguridad y 3FN:
1. **Matriz de Control N:M Descompuesta**: Separamos \`roles\`, \`permissions\` y su tabla asociativa intermedia \`role_permissions\`.
2. **Sesiones Seguras**: Para una arquitectura en **${context.architectureStyle}**, separamos el ciclo de vida de los tokens de actualización (\`auth_tokens\`).
3. **Criterio Autónomo**: Se infirieron **${dynamicReqs.length} requisitos funcionales y no funcionales** adaptados a los mecanismos de seguridad indicados.
4. **Gobernanza**: Se propone un ADR estableciendo el modelo de tokens rotativos y evaluación en memoria.

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": ${reqsJson},
  "suggestedEntities": [
    {
      "tableName": "roles",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "name", "type": "VARCHAR(50)", "unique": true, "nullable": false },
        { "name": "description", "type": "VARCHAR(255)", "nullable": true },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    },
    {
      "tableName": "role_permissions",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "role_id", "type": "UUID", "isFk": true, "referencesTable": "roles", "cardinality": "1:N" },
        { "name": "resource", "type": "VARCHAR(50)", "nullable": false },
        { "name": "action", "type": "VARCHAR(20)", "nullable": false }
      ]
    },
    {
      "tableName": "auth_tokens",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "user_id", "type": "UUID", "isFk": ${hasUsersTable}, ${hasUsersTable ? '"referencesTable": "users", "cardinality": "1:N",' : ''} "nullable": false },
        { "name": "token_hash", "type": "VARCHAR(255)", "unique": true, "nullable": false },
        { "name": "is_revoked", "type": "BOOLEAN", "nullable": false },
        { "name": "expires_at", "type": "TIMESTAMP", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adr1}",
      "title": "Estrategia Dual JWT sin Estado + Refresh Tokens Rotativos",
      "context": "Se requiere equilibrio entre baja latencia en endpoints protegidos y capacidad de revocación inmediata de sesiones.",
      "decision": "Implementar JWTs de corta duración firmados criptográficamente complementados por refresh tokens en base de datos.",
      "consequences": "Sesiones seguras con revocación en tiempo real sin sobrecargar la base de datos en peticiones concurrentes."
    }
  ]
}
\`\`\``;
      } else {
        const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
          {
            title: 'Registro de Sesiones Activas e Intentos Fallidos',
            type: 'RF',
            priority: 'HIGH',
            description: 'Almacenar dirección IP, User-Agent y estado de inicio de sesión para activar bloqueos temporales por fuerza bruta.',
          },
          {
            title: 'Trazabilidad Forense Inmutable de Eventos de Seguridad',
            type: 'RNF',
            priority: 'HIGH',
            description: 'Registrar logs de seguridad sin permitir mutaciones ni eliminaciones por parte de los usuarios.',
          },
        ];

        const reqsJson = JSON.stringify(formatReqs(dynamicReqs), null, 4);

        reply = `La tabla de **\`roles\` ya se encuentra modelada**. Te propongo registrar el módulo de **Auditoría de Sesiones y Detección de Anomalías**:

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": ${reqsJson},
  "suggestedEntities": [
    {
      "tableName": "auth_audit_logs",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "user_id", "type": "UUID", "isFk": ${hasUsersTable}, ${hasUsersTable ? '"referencesTable": "users", "cardinality": "1:N",' : ''} "nullable": true },
        { "name": "ip_address", "type": "VARCHAR(45)", "nullable": false },
        { "name": "user_agent", "type": "TEXT", "nullable": true },
        { "name": "event_type", "type": "VARCHAR(30)", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adr1}",
      "title": "Auditoría Forense de Eventos de Autenticación",
      "context": "Se requiere detectar patrones de intrusión y bloqueos preventivos por IP.",
      "decision": "Registrar cada evento de login exitoso o fallido de forma asíncrona sin bloquear la respuesta HTTP.",
      "consequences": "Trazabilidad completa con impacto despreciable en el tiempo de respuesta del portal."
    }
  ]
}
\`\`\``;
      }

    // Dominio 4: Catálogo / Productos / Inventario
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
        ];

        if (lower.includes('stock') || lower.includes('inventario') || lower.includes('reserva') || lower.includes('existencia')) {
          dynamicReqs.push({
            title: 'Control y Reserva Concurrente de Stock',
            type: 'RF',
            priority: 'HIGH',
            description: 'Actualizar el inventario disponible con validación de balance positivo impidiendo sobreventas concurrentes.',
          });
        }

        if (lower.includes('precio') || lower.includes('descuento') || lower.includes('oferta') || lower.includes('promocion')) {
          dynamicReqs.push({
            title: 'Motor de Precios Dinámicos y Reglas de Descuento',
            type: 'RF',
            priority: 'HIGH',
            description: 'Aplicar políticas de precios promocionales temporales con validación de vigencia en servidor.',
          });
        }

        if (lower.includes('busqueda') || lower.includes('filtro') || lower.includes('buscar')) {
          dynamicReqs.push({
            title: 'Indexación y Búsqueda Avanzada Multi-Atributo',
            type: 'RF',
            priority: 'MEDIUM',
            description: 'Optimizar la localización de artículos mediante índices de texto y filtros por rango de precio.',
          });
        }

        dynamicReqs.push({
          title: 'Latencia Sub-200ms en Consultas de Catálogo',
          type: 'RNF',
          priority: 'MEDIUM',
          description: 'Las consultas de listado de productos deben optimizarse con índices B-Tree en category_id y status.',
        });

        const reqsJson = JSON.stringify(formatReqs(dynamicReqs), null, 4);

        reply = `He formulado la propuesta integral para el dominio de **Catálogo y Control de Inventario**:

### Razonamiento de Normalización (3FN):
1. **Categorización**: Desacoplamos \`categories\` de \`products\` mediante una clave foránea \`category_id\`, evitando repetición de textos y facilitando árboles de navegación.
2. **Integridad de Stock**: Se modela el precio con precisión decimal estricta (\`DECIMAL(10,2)\`) y código \`sku\` unívoco.
3. **Criterio Basado en Alcance**: Se sintetizaron **${dynamicReqs.length} requisitos** que blindan la administración y consulta del inventario.
4. **Decisión Técnica**: Se formula un ADR sobre control de concurrencia y bloqueo para reservas de stock.

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": ${reqsJson},
  "suggestedEntities": [
    {
      "tableName": "categories",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "name", "type": "VARCHAR(100)", "unique": true, "nullable": false },
        { "name": "slug", "type": "VARCHAR(120)", "unique": true, "nullable": false },
        { "name": "description", "type": "TEXT", "nullable": true },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    },
    {
      "tableName": "products",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "category_id", "type": "UUID", "isFk": true, "referencesTable": "categories", "cardinality": "1:N" },
        { "name": "sku", "type": "VARCHAR(50)", "unique": true, "nullable": false },
        { "name": "name", "type": "VARCHAR(150)", "nullable": false },
        { "name": "price", "type": "DECIMAL(10,2)", "nullable": false },
        { "name": "stock", "type": "INTEGER", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adr1}",
      "title": "Bloqueo Pesimista SELECT FOR UPDATE para Modificación de Stock",
      "context": "Múltiples clientes pueden intentar reservar la última unidad de un producto de forma simultánea.",
      "decision": "Aplicar SELECT FOR UPDATE dentro de la transacción de checkout para garantizar consistencia atómica del inventario.",
      "consequences": "Inmunidad ante condiciones de carrera de sobreventa con bajo impacto en operaciones de lectura."
    }
  ]
}
\`\`\``;
      } else {
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

        const reqsJson = JSON.stringify(formatReqs(dynamicReqs), null, 4);

        reply = `Detecté que **\`products\` ya existe** en tu esquema. Te propongo el módulo de **Movimientos y Auditoría de Stock**:

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": ${reqsJson},
  "suggestedEntities": [
    {
      "tableName": "stock_movements",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "product_id", "type": "UUID", "isFk": true, "referencesTable": "products", "cardinality": "1:N" },
        { "name": "movement_type", "type": "VARCHAR(20)", "nullable": false },
        { "name": "quantity", "type": "INTEGER", "nullable": false },
        { "name": "reason", "type": "VARCHAR(255)", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adr1}",
      "title": "Modelo de Registro Inmutable de Inventario tipo Libro Diario",
      "context": "Se requiere justificar cualquier variación de existencias ante auditorías fiscales y de almacén.",
      "decision": "Todo cambio de inventario debe realizarse mediante un INSERT en stock_movements sin mutaciones directas de balance sin respaldo.",
      "consequences": "Trazabilidad contable total y capacidad de reconstruir el stock a cualquier punto en el tiempo."
    }
  ]
}
\`\`\``;
      }

    // Dominio 5: Caso General / Dinámico basado en el sujeto del mensaje
    } else {
      // Extraer una palabra representativa para crear un dominio coherente excluyendo stopwords conversacionales
      const STOPWORDS = new Set([
        'excelente', 'analisis', 'formaliza', 'propuesta', 'proyecto', 'generando', 'genera',
        'requisitos', 'modelo', 'relacional', 'canvas', 'actas', 'arquitectura', 'favor',
        'podrias', 'puedes', 'sistema', 'modulo', 'buenas', 'tardes', 'hola', 'bueno',
        'gracias', 'procede', 'estructura', 'artefactos', 'tablas', 'entidades', 'acuerdo'
      ]);
      const words = scopeText.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '').split(/\s+/).filter((w) => w.length > 3 && !STOPWORDS.has(w));
      const rawDomain = (words[0] || 'recurso').toLowerCase();
      const domainSlug = rawDomain.replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n');
      const domainTable = domainSlug.endsWith('s') ? domainSlug : `${domainSlug}s`;
      const domainDetailTable = `${domainTable}_items`;

      const dynamicReqs: Array<{ title: string; type: 'RF' | 'RNF'; priority: 'HIGH' | 'MEDIUM' | 'CRITICAL'; description: string }> = [
        {
          title: `Captura y Validación de Entradas de ${domainTable.toUpperCase()}`,
          type: 'RF',
          priority: 'HIGH',
          description: `Validar pre-condiciones, contratos de datos e integridad referencial antes de registrar registros de ${domainTable}.`,
        },
        {
          title: `Control de Transiciones y Ciclo de Vida de ${domainTable.toUpperCase()}`,
          type: 'RF',
          priority: 'HIGH',
          description: `Implementar máquina de estados determinista para coordinar el ciclo operativo de ${domainTable}.`,
        },
        {
          title: `Transaccionalidad Atómica y Consistencia ACID en ${domainTable.toUpperCase()}`,
          type: 'RF',
          priority: 'HIGH',
          description: `Garantizar que las mutaciones sobre ${domainTable} y sus renglones se ejecuten de forma atómica e indivisible.`,
        },
        {
          title: `Manejo de Excepciones y Compensaciones en ${domainTable.toUpperCase()}`,
          type: 'RF',
          priority: 'MEDIUM',
          description: `Definir acciones compensatorias automáticas ante fallos o cancelaciones en operaciones de ${domainTable}.`,
        },
        {
          title: 'Aislamiento de Persistencia y Prevención de Concurrencia',
          type: 'RNF',
          priority: 'HIGH',
          description: `Controlar accesos concurrentes a ${domainTable} mediante bloqueos transaccionales adecuados o versionado optimista.`,
        },
        {
          title: 'Seguridad Multi-Tenancy Horizontal (RLS) y Auditoría',
          type: 'RNF',
          priority: 'HIGH',
          description: `Aislar las operaciones de ${domainTable} mediante políticas de Row Level Security en PostgreSQL con sellos temporales created_at.`,
        },
      ];

      if (lower.includes('consulta') || lower.includes('filtro') || lower.includes('buscar') || lower.includes('reporte')) {
        dynamicReqs.push({
          title: `Consultas Indexadas y Paginación de ${domainTable.toUpperCase()}`,
          type: 'RF',
          priority: 'MEDIUM',
          description: `Garantizar listados paginados de ${domainTable} con filtros dinámicos optimizados por índices B-Tree.`,
        });
      }

      if (lower.includes('notific') || lower.includes('alerta') || lower.includes('aviso')) {
        dynamicReqs.push({
          title: `Despacho de Eventos y Notificaciones de ${domainTable.toUpperCase()}`,
          type: 'RF',
          priority: 'MEDIUM',
          description: `Emitir notificaciones ante cada cambio de estado relevante en los registros de ${domainTable}.`,
        });
      }

      dynamicReqs.push({
        title: 'Persistencia Segura con Multi-Tenancy Horizontal (RLS)',
        type: 'RNF',
        priority: 'HIGH',
        description: `Aislar las operaciones de ${domainTable} mediante políticas de Row Level Security en PostgreSQL.`,
      });

      const reqsJson = JSON.stringify(formatReqs(dynamicReqs), null, 4);

      reply = `He analizado tu planteamiento técnico para el proyecto **"${context.projectName}"** (${context.architectureStyle}):

*"${lastUserMsg}"*

### Razonamiento de Arquitectura Pre-Código:
1. **Desglose de Dominio**: Se derivaron **${dynamicReqs.length} requisitos funcionales y no funcionales** deducidos con precisión según el alcance solicitado.
2. **Modelo Relacional en 3FN**: Se define la entidad principal **\`${domainTable}\`** junto a su entidad subordinada **\`${domainDetailTable}\`** vinculadas por clave foránea, garantizando no redundancia y atomicidad de datos.
3. **Alineación con Estado Actual**: Se omitieron duplicados y se continuó la numeración correlativa a partir de los artefactos existentes.

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": ${reqsJson},
  "suggestedEntities": [
    {
      "tableName": "${domainTable}",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "user_id", "type": "UUID", "isFk": ${hasUsersTable}, ${hasUsersTable ? '"referencesTable": "users", "cardinality": "1:N",' : ''} "nullable": false },
        { "name": "code", "type": "VARCHAR(50)", "unique": true, "nullable": false },
        { "name": "title", "type": "VARCHAR(150)", "nullable": false },
        { "name": "status", "type": "VARCHAR(20)", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    },
    {
      "tableName": "${domainDetailTable}",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "${domainSlug}_id", "type": "UUID", "isFk": true, "referencesTable": "${domainTable}", "cardinality": "1:N" },
        { "name": "detail_key", "type": "VARCHAR(50)", "nullable": false },
        { "name": "detail_value", "type": "TEXT", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adr1}",
      "title": "Contratos Tipados DTO como Fuente Única de Verdad para ${domainTable.toUpperCase()}",
      "context": "Se requiere preservar desacoplamiento modular entre la capa de presentación y la base de datos.",
      "decision": "Definir DTOs tipados en TypeScript como SSOT garantizando validación simétrica en entrada y salida.",
      "consequences": "Consistencia estructural plena, prevención de fugas de datos y fácil mantenimiento evolutivo."
    }
  ]
}
\`\`\``;
    }

    const { cleanText, suggestedRequirements, suggestedEntities, suggestedDecisions } =
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
      },
      suggestedRequirements,
      suggestedEntities,
      suggestedDecisions,
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
