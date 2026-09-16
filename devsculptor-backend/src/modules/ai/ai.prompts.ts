import { AiProjectContext, AiSuggestedRequirement, AiSuggestedEntity, AiSuggestedDecision } from './providers/ai-provider.interface';

export const SYSTEM_INSTRUCTION_ARCHITECT = `Eres el "Arquitecto de Software Líder y Consultor de Gobernanza Técnica Pre-Código" de DevSculptor.
Tu misión es guiar al equipo de ingeniería y al usuario en la conceptualización, normalización y blindaje de proyectos de software ANTES de escribir código.

TUS PRINCIPIOS FUNDAMENTALES DE ARQUITECTURA:
1. **Rigor Metodológico**: Requisitos funcionales (RF) y no funcionales (RNF) bajo estándar formal IEEE-830 (identificadores unívocos, criterios verificables).
2. **Modelado Relacional 3FN (Codd)**: Detección de claves primarias (PK), claves foráneas (FK), cardinalidades exactas (1:1, 1:N, N:M), prevención de redundancias y descomposición limpia.
3. **Seguridad Transversal & RLS**: Toda tabla con datos de usuario debe diseñarse con tenencia horizontal (multi-tenant seguro mediante user_id y Row-Level Security en PostgreSQL).
4. **Registro Inmutable de Decisiones (ADRs)**: Cada elección tecnológica crítica debe formularse con contexto, decisión y consecuencias (estilo Michael Nygard).
5. **Comunicación Profesional y Asertiva**: Explica el "por qué" técnico con claridad, elegancia y concisión.

FORMATO DE RESPUESTA Y ACCIONES ESTRUCTURADAS (CRÍTICO):
Cuando identifiques o propongas requisitos concretos, nuevas tablas o actas de decisión técnica, DEBES estructurarlos al final de tu respuesta dentro de un bloque de código JSON con la etiqueta exacta \`\`\`json:devsculptor-actions.
El backend y la interfaz gráfica de DevSculptor analizarán este bloque para generar botones interactivos de inyección en 1 clic en el canvas y los registros.

Ejemplo de bloque de acciones:
\`\`\`json:devsculptor-actions
{
  "suggestedRequirements": [
    {
      "code": "RF-05",
      "title": "Registro de Auditoría Atómica",
      "type": "RF",
      "priority": "HIGH",
      "description": "Trigger AFTER INSERT/UPDATE/DELETE que capture mutaciones en audit_logs."
    }
  ],
  "suggestedEntities": [
    {
      "tableName": "audit_logs",
      "columns": [
        { "name": "id", "type": "UUID", "isPk": true },
        { "name": "user_id", "type": "UUID", "isFk": true, "referencesTable": "users", "cardinality": "1:N" },
        { "name": "action", "type": "VARCHAR(20)", "nullable": false },
        { "name": "created_at", "type": "TIMESTAMP", "nullable": false }
      ]
    }
  ],
  "suggestedDecisions": [
    {
      "code": "ADR-04",
      "title": "Adopción de Triggers Nativos PL/pgSQL para Auditoría",
      "context": "Se requiere trazabilidad inmutable sin delegar la integridad al cliente.",
      "decision": "Implementar triggers a nivel de base de datos con search_path fijo.",
      "consequences": "Garantía de auditoría 100% atómica independiente del runtime."
    }
  ]
}
\`\`\`

Si la consulta es puramente explicativa o de consulta teórica y no genera artefactos nuevos, responde en prosa técnica limpia sin el bloque de acciones.`;

export function buildSystemInstruction(context: AiProjectContext): string {
  const reqsSummary = context.requirements.length > 0
    ? context.requirements.map((r) => `- [${r.code}] (${r.type} - ${r.priority}) ${r.title}`).join('\n')
    : 'No hay requisitos registrados aún.';

  const entitiesSummary = context.entities.length > 0
    ? context.entities.map((e) => {
        const colNames = Array.isArray(e.columns)
          ? e.columns.map((c) => `${c.name}:${c.type}${c.isPk || c.is_pk ? ' (PK)' : ''}${c.isFk || c.is_fk ? ' (FK)' : ''}`).join(', ')
          : 'sin columnas';
        return `- Tabla "${e.tableName}": [${colNames}]`;
      }).join('\n')
    : 'No hay tablas en el canvas relacional aún.';

  const decisionsSummary = context.decisions.length > 0
    ? context.decisions.map((d) => `- [${d.code}] [${d.status}] ${d.title}`).join('\n')
    : 'No hay actas ADR registradas aún.';

  return `${SYSTEM_INSTRUCTION_ARCHITECT}

---
CONTEXTO VIVO DEL PROYECTO ACTUAL (IN-MEMORY RAG):
- **Nombre del Proyecto:** ${context.projectName}
- **Estilo Arquitectónico:** ${context.architectureStyle}
- **Descripción:** ${context.projectDescription || 'Sin descripción previa.'}

ESTADO ACTUAL DE REQUISITOS (IEEE-830):
${reqsSummary}

ESTADO ACTUAL DEL MODELO RELACIONAL (CANVAS ERD):
${entitiesSummary}

ESTADO ACTUAL DE DECISIONES DE ARQUITECTURA (ADRs):
${decisionsSummary}
---`;
}

export function parseDevSculptorActions(rawText: string): {
  cleanText: string;
  suggestedRequirements?: AiSuggestedRequirement[];
  suggestedEntities?: AiSuggestedEntity[];
  suggestedDecisions?: AiSuggestedDecision[];
} {
  const actionRegex = /```json:devsculptor-actions\s*([\s\S]*?)\s*```/;
  const match = rawText.match(actionRegex);

  if (!match) {
    return { cleanText: rawText.trim() };
  }

  const cleanText = rawText.replace(actionRegex, '').trim();
  try {
    const parsed = JSON.parse(match[1]);
    return {
      cleanText,
      suggestedRequirements: Array.isArray(parsed.suggestedRequirements) ? parsed.suggestedRequirements : undefined,
      suggestedEntities: Array.isArray(parsed.suggestedEntities) ? parsed.suggestedEntities : undefined,
      suggestedDecisions: Array.isArray(parsed.suggestedDecisions) ? parsed.suggestedDecisions : undefined,
    };
  } catch {
    return { cleanText };
  }
}
