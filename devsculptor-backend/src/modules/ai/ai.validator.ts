import {
  AiChatResult,
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
import { logger } from '../../config/logger';

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Filtro de compuerta dura (Hard Gate) por actionContext:
 * Garantiza que la respuesta de la IA no contenga artefactos fuera de la categoría solicitada.
 */
export function applyActionContextHardGate(
  actions: NonNullable<AiChatResult['actions']>,
  actionContext?: string
): NonNullable<AiChatResult['actions']> {
  if (!actionContext || actionContext === 'general') {
    return actions;
  }

  const ctx = actionContext.toLowerCase();

  if (ctx === 'conversation') {
    return {};
  }
  if (ctx === 'requirements') {
    return {
      requirements: actions.requirements,
      mutatedRequirements: actions.mutatedRequirements,
    };
  }
  if (ctx === 'canvas' || ctx === 'entities') {
    return {
      entities: actions.entities,
      mutatedEntities: actions.mutatedEntities,
    };
  }
  if (ctx === 'diagrams') {
    return {
      diagrams: actions.diagrams,
      mutatedDiagrams: actions.mutatedDiagrams,
    };
  }
  if (ctx === 'adr' || ctx === 'decisions') {
    return {
      decisions: actions.decisions,
      mutatedDecisions: actions.mutatedDecisions,
    };
  }

  return actions;
}

/**
 * Deduplica semánticamente requisitos contra el estado actual y OKF, y renumera correlativamente.
 */
export function deduplicateAndRenumberRequirements(
  suggested: AiSuggestedRequirement[] | undefined,
  context: AiProjectContext
): AiSuggestedRequirement[] | undefined {
  if (!suggested || suggested.length === 0) return undefined;

  const existingTokens: Array<{ tokens: Set<string>; title: string }> = context.requirements.map((r) => ({
    tokens: tokenize(`${r.title} ${r.description || ''}`),
    title: r.title.toLowerCase().trim(),
  }));

  if (context.okfDocuments) {
    for (const doc of context.okfDocuments) {
      existingTokens.push({
        tokens: tokenize(doc.title),
        title: doc.title.toLowerCase().trim(),
      });
    }
  }

  const deduped: AiSuggestedRequirement[] = [];
  for (const req of suggested) {
    const titleNorm = req.title.toLowerCase().trim();
    const reqTokens = tokenize(`${req.title} ${req.description || ''}`);

    const isDuplicate = existingTokens.some(
      (e) => e.title === titleNorm || jaccardSimilarity(e.tokens, reqTokens) >= 0.75
    );

    if (!isDuplicate) {
      deduped.push(req);
      existingTokens.push({ tokens: reqTokens, title: titleNorm });
    }
  }

  let rfNum = parseInt(context.nextRfCode?.replace(/\D/g, '') || '1', 10);
  let rnfNum = parseInt(context.nextRnfCode?.replace(/\D/g, '') || '1', 10);

  return deduped.map((r) => {
    const isRf = r.type === 'RF';
    const code = isRf
      ? `RF-${String(rfNum++).padStart(2, '0')}`
      : `RNF-${String(rnfNum++).padStart(2, '0')}`;
    return {
      ...r,
      code,
    };
  });
}

/**
 * Deduplica y renumera decisiones de arquitectura (ADRs) correlativamente.
 */
export function deduplicateAndRenumberDecisions(
  suggested: AiSuggestedDecision[] | undefined,
  context: AiProjectContext
): AiSuggestedDecision[] | undefined {
  if (!suggested || suggested.length === 0) return undefined;

  const existingTitles = new Set(context.decisions.map((d) => d.title.toLowerCase().trim()));
  const deduped: AiSuggestedDecision[] = [];

  for (const dec of suggested) {
    const titleNorm = dec.title.toLowerCase().trim();
    if (!existingTitles.has(titleNorm)) {
      deduped.push(dec);
      existingTitles.add(titleNorm);
    }
  }

  let adrNum = parseInt(context.nextAdrCode?.replace(/\D/g, '') || '1', 10);
  return deduped.map((d) => ({
    ...d,
    code: `ADR-${String(adrNum++).padStart(2, '0')}`,
  }));
}

/**
 * Garantiza grafo relacional conexo (auto-sintetiza tablas padre faltantes) y
 * ordena topológicamente las entidades para que las tablas padre se creen antes que las hijas con FK.
 */
export function sanitizeAndSortEntities(
  suggested: AiSuggestedEntity[] | undefined,
  context: AiProjectContext
): AiSuggestedEntity[] | undefined {
  if (!suggested || suggested.length === 0) return undefined;

  const existingTableNames = new Set(context.entities.map((e) => e.tableName.toLowerCase()));
  const suggestedTableMap = new Map<string, AiSuggestedEntity>();

  for (const ent of suggested) {
    suggestedTableMap.set(ent.tableName.toLowerCase(), ent);
  }

  // Auto-sintetizar tablas padre faltantes referenciadas en FKs
  const synthesizedParents: AiSuggestedEntity[] = [];
  for (const ent of suggested) {
    for (const col of ent.columns) {
      if (col.isFk && col.referencesTable) {
        const refLower = col.referencesTable.toLowerCase();
        if (!existingTableNames.has(refLower) && !suggestedTableMap.has(refLower)) {
          logger.info(
            { parentTable: col.referencesTable, childTable: ent.tableName },
            'Auto-sintetizando tabla padre faltante para garantizar grafo relacional conexo'
          );
          const parentStub: AiSuggestedEntity = {
            tableName: col.referencesTable,
            columns: [
              { name: col.referencesColumn || 'id', type: 'UUID', isPk: true },
              { name: 'name', type: 'VARCHAR(150)', nullable: false },
              { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
          };
          suggestedTableMap.set(refLower, parentStub);
          synthesizedParents.push(parentStub);
        }
      }
    }
  }

  const allEntities = [...synthesizedParents, ...suggested];

  // Ordenamiento topológico: si la tabla A tiene FK a la tabla B, B debe ir antes de A.
  const dependencies = new Map<string, Set<string>>();
  for (const ent of allEntities) {
    const tName = ent.tableName.toLowerCase();
    const deps = new Set<string>();
    for (const col of ent.columns) {
      if (col.isFk && col.referencesTable) {
        const refLower = col.referencesTable.toLowerCase();
        if (refLower !== tName && suggestedTableMap.has(refLower)) {
          deps.add(refLower);
        }
      }
    }
    dependencies.set(tName, deps);
  }

  const sorted: AiSuggestedEntity[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(tableName: string) {
    if (visited.has(tableName)) return;
    if (visiting.has(tableName)) {
      // Romper ciclo si hubiera dependencia circular
      return;
    }
    visiting.add(tableName);
    const deps = dependencies.get(tableName);
    if (deps) {
      for (const dep of deps) {
        visit(dep);
      }
    }
    visiting.delete(tableName);
    visited.add(tableName);
    const ent = suggestedTableMap.get(tableName);
    if (ent && !sorted.some((s) => s.tableName.toLowerCase() === tableName)) {
      sorted.push(ent);
    }
  }

  for (const ent of allEntities) {
    visit(ent.tableName.toLowerCase());
  }

  return sorted.length > 0 ? sorted : undefined;
}

/**
 * Valida y sanea mutaciones agénticas de entidades contra el esquema actual.
 */
export function sanitizeMutatedEntities(
  mutations: AiEntityMutation[] | undefined,
  context: AiProjectContext
): AiEntityMutation[] | undefined {
  if (!mutations || mutations.length === 0) return undefined;

  const existingTableMap = new Map(context.entities.map((e) => [e.tableName.toLowerCase(), e]));

  const validMutations: AiEntityMutation[] = [];
  for (const m of mutations) {
    const targetLower = m.targetTableName.toLowerCase().trim();
    const existingTable = existingTableMap.get(targetLower);

    // Si la tabla no existe en el contexto y la acción es UPDATE o DELETE, advertir pero permitir si el nombre es coherente
    if (!existingTable && m.action !== 'CREATE') {
      logger.warn(
        { targetTableName: m.targetTableName, action: m.action },
        'Aviso de mutación: la tabla objetivo no se encontró en el contexto local'
      );
    }

    // Normalizar columnMutations
    let sanitizedCols = m.columnMutations;
    if (sanitizedCols && sanitizedCols.length > 0) {
      sanitizedCols = sanitizedCols.map((cm: ColumnMutation) => ({
        type: cm.type,
        column: {
          ...cm.column,
          name: cm.column.name.trim().toLowerCase(),
          type: cm.column.type ? cm.column.type.trim().toUpperCase() : 'VARCHAR(255)',
        },
        previousColumnName: cm.previousColumnName ? cm.previousColumnName.trim().toLowerCase() : undefined,
      }));
    }

    validMutations.push({
      ...m,
      columnMutations: sanitizedCols,
    });
  }

  return validMutations.length > 0 ? validMutations : undefined;
}

/**
 * Sanitizador Maestro de Respuestas IA:
 * Aplica compuertas duras, deduplicación, ordenamiento topológico, validación de mutaciones y sincronización canónica.
 */
export function sanitizeAiResponse(
  rawResult: AiChatResult,
  context: AiProjectContext,
  actionContext?: string
): AiChatResult {
  const initialActions = {
    requirements: rawResult.actions?.requirements || rawResult.suggestedRequirements,
    entities: rawResult.actions?.entities || rawResult.suggestedEntities,
    decisions: rawResult.actions?.decisions || rawResult.suggestedDecisions,
    diagrams: rawResult.actions?.diagrams || rawResult.suggestedDiagrams,
    mutatedEntities: rawResult.actions?.mutatedEntities || rawResult.mutatedEntities,
    mutatedRequirements: rawResult.actions?.mutatedRequirements || rawResult.mutatedRequirements,
    mutatedDecisions: rawResult.actions?.mutatedDecisions || rawResult.mutatedDecisions,
    mutatedDiagrams: rawResult.actions?.mutatedDiagrams || rawResult.mutatedDiagrams,
  };

  // 1. Aplicar Hard Gate por actionContext
  const gatedActions = applyActionContextHardGate(initialActions, actionContext);

  // 2. Sanitizar requisitos
  const sanitizedReqs = deduplicateAndRenumberRequirements(gatedActions.requirements, context);

  // 3. Sanitizar y ordenar topológicamente entidades
  const sanitizedEntities = sanitizeAndSortEntities(gatedActions.entities, context);

  // 4. Sanitizar decisiones
  const sanitizedDecisions = deduplicateAndRenumberDecisions(gatedActions.decisions, context);

  // 5. Sanitizar mutaciones de entidades
  const sanitizedMutatedEntities = sanitizeMutatedEntities(gatedActions.mutatedEntities, context);

  // 6. Diagramas
  const sanitizedDiagrams: AiSuggestedDiagram[] | undefined =
    gatedActions.diagrams && gatedActions.diagrams.length > 0 ? gatedActions.diagrams : undefined;

  const finalActions = {
    requirements: sanitizedReqs,
    entities: sanitizedEntities,
    decisions: sanitizedDecisions,
    diagrams: sanitizedDiagrams,
    mutatedEntities: sanitizedMutatedEntities,
    mutatedRequirements: gatedActions.mutatedRequirements,
    mutatedDecisions: gatedActions.mutatedDecisions,
    mutatedDiagrams: gatedActions.mutatedDiagrams,
  };

  return {
    ...rawResult,
    actions: finalActions,
    suggestedRequirements: sanitizedReqs,
    suggestedEntities: sanitizedEntities,
    suggestedDecisions: sanitizedDecisions,
    suggestedDiagrams: sanitizedDiagrams,
    mutatedEntities: sanitizedMutatedEntities,
    mutatedRequirements: gatedActions.mutatedRequirements,
    mutatedDecisions: gatedActions.mutatedDecisions,
    mutatedDiagrams: gatedActions.mutatedDiagrams,
  };
}
