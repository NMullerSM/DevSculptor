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

    let reply = '';
    const existingTableNames = context.entities.map((e) => e.tableName.toLowerCase());
    const nextRfNum = context.requirements.length + 1;
    const rfCode = `RF-${nextRfNum < 10 ? '0' + nextRfNum : nextRfNum}`;
    const nextAdrNum = context.decisions.length + 1;
    const adrCode = `ADR-${nextAdrNum < 10 ? '0' + nextAdrNum : nextAdrNum}`;

    if (lower.includes('pago') || lower.includes('payment') || lower.includes('checkout') || lower.includes('suscrip')) {
      reply = `Como Arquitecto de Software, he evaluado la inclusión del módulo de pagos para el proyecto **"${context.projectName}"** (${context.architectureStyle}).

Para garantizar la integridad transaccional (ACID) y el cumplimiento PCI-DSS, se recomienda:
1. **Separación de responsabilidades**: La tabla de transacciones de pago no debe almacenar números de tarjeta en crudo; debe operar mediante tokens de pasarela (ej. Stripe o MercadoPago).
2. **Idempotencia Transaccional**: Toda orden de cobro requiere un UUID de idempotencia para prevenir dobles cobros ante reintentos de red.
3. **Auditoría e Inmutabilidad**: Los estados de pago (\`PENDING\`, \`COMPLETED\`, \`FAILED\`) deben registrarse con timestamps precisos y políticas RLS estrictas.

He preparado las especificaciones formales y la tabla para inyectar en tu arquitectura:

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": [
    {
      "code": "${rfCode}",
      "title": "Procesamiento Idempotente de Pagos",
      "type": "RF",
      "priority": "HIGH",
      "description": "Procesar transacciones mediante tokens de pasarela externa con validación de idempotencia UUID v4."
    }
  ],
  "suggestedEntities": [
    {
      "tableName": "payments",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "user_id", "type": "UUID", "isFk": false },
        { "name": "amount", "type": "DECIMAL(12,2)", "nullable": false },
        { "name": "currency", "type": "VARCHAR(3)", "nullable": false },
        { "name": "status", "type": "VARCHAR(20)", "nullable": false },
        { "name": "idempotency_key", "type": "UUID", "unique": true },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adrCode}",
      "title": "Adopción de Pasarela Externa Tokenizada para Pagos",
      "context": "Se requiere procesar pagos minimizando el alcance de cumplimiento PCI-DSS.",
      "decision": "Delegar la captura de tarjetas sensibles a pasarela externa y almacenar únicamente tokens e idempotencia.",
      "consequences": "Mayor seguridad, reducción de superficie de ataque y cumplimiento normativo inmediato."
    }
  ]
}
\`\`\``;
    } else if (lower.includes('normaliz') || lower.includes('3fn') || lower.includes('codd') || lower.includes('forma normal')) {
      const tableCount = context.entities.length;
      reply = `He auditado la normalización relacional del proyecto **"${context.projectName}"** bajo las reglas de Codd:

- **1FN (Atomicidad)**: Se evaluaron ${tableCount} tablas. Todas las columnas primitivas son atómicas.
- **2FN (Dependencia Completa)**: Las claves primarias están estandarizadas como UUIDs subrogados, eliminando dependencias de clave compuesta parcial.
- **3FN (Dependencia Transitiva)**: El esquema actual mantiene bajo acoplamiento.

Recomendación de gobernanza: Para tablas con catálogos (estados, roles o tipos), mantén tablas maestras separadas con claves foráneas en lugar de cadenas de texto libres.`;
    } else if (lower.includes('auth') || lower.includes('usuario') || lower.includes('login') || lower.includes('token')) {
      const hasAuthTokens = existingTableNames.includes('auth_tokens') || existingTableNames.includes('tokens');
      reply = `Análisis de Autenticación y Seguridad para **"${context.projectName}"**:

Para una arquitectura en **${context.architectureStyle}**, el modelo de sesión recomendado es:
- **Access Tokens JWT**: De corta vida (15m - 2h), firmados con HS256/RS256, sin estado en base de datos.
- **Refresh Tokens Rotativos**: Almacenados en una tabla con revocación explícita (\`revoked: boolean\`) y expiración fija.

${!hasAuthTokens ? `He estructurado la tabla de persistencia de tokens de sesión para el canvas:` : 'El modelo ya contempla entidades de autenticación activas.'}

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": [
    {
      "code": "${rfCode}",
      "title": "Rotación de Refresh Tokens con Revocación Inmediata",
      "type": "RF",
      "priority": "HIGH",
      "description": "Emisión de tokens de actualización con hash SHA-256 en base de datos y revocación ante detección de reuso."
    }
  ],
  "suggestedEntities": [
    {
      "tableName": "auth_tokens",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "user_id", "type": "UUID", "isFk": false },
        { "name": "token_hash", "type": "VARCHAR(255)", "unique": true },
        { "name": "is_revoked", "type": "BOOLEAN", "nullable": false },
        { "name": "expires_at", "type": "TIMESTAMP", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "${adrCode}",
      "title": "Estrategia Dual JWT + Refresh Tokens Persistidos",
      "context": "Se requiere equilibrio entre baja latencia en endpoints protegidos y capacidad de revocación inmediata de sesiones.",
      "decision": "Implementar JWTs sin estado en conjunto con refresh tokens rotativos auditados en base de datos.",
      "consequences": "Sesiones seguras con revocación en tiempo real sin saturar la base de datos en cada request."
    }
  ]
}
\`\`\``;
    } else {
      reply = `He analizado tu planteamiento técnico para el proyecto **"${context.projectName}"**:

*"${lastUserMsg}"*

Desde la perspectiva de Gobernanza Técnica Pre-Código:
1. **Coherencia con el Estilo Arquitectónico**: El proyecto está definido como **${context.architectureStyle}**. Todas las entidades y endpoints deben preservar bajo acoplamiento y contratos de datos tipados (DTOs como SSOT).
2. **Estado del Modelo**: Actualmente cuentas con **${context.requirements.length} requisitos**, **${context.entities.length} tablas en el canvas** y **${context.decisions.length} actas ADR**.
3. **Recomendación Inmediata**: Continúa modelando los atributos y claves foráneas en el Canvas ERD antes de exportar el paquete de prompts OKF para Cursor o Claude.

\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": [
    {
      "code": "${rfCode}",
      "title": "Validación Estricta de Contratos de Entrada",
      "type": "RNF",
      "priority": "HIGH",
      "description": "Validación en runtime de todas las cargas útiles entrantes mediante esquemas Zod antes de acceder al controlador."
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
