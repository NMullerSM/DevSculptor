import {
  AiChatResult,
  AiSuggestedEntity,
  AiEntityMutation,
  AiSuggestedRequirement,
  AiSuggestedDecision,
  AiSuggestedDiagram,
} from '../ai/providers/ai-provider.interface';
import {
  BenchmarkScenario,
  EvaluationResult,
  CanvasEvaluationDetail,
  RequirementsEvaluationDetail,
  DecisionsEvaluationDetail,
  DiagramsEvaluationDetail,
} from './benchmark.types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .trim();
}

export function evaluateCanvas(
  result: AiChatResult,
  scenario: BenchmarkScenario
): CanvasEvaluationDetail {
  const rubric = scenario.expectedRubric.canvas;
  const notes: string[] = [];

  if (!rubric) {
    return {
      passed: true,
      score: 100,
      matchedTables: [],
      missingTables: [],
      matchedColumns: [],
      missingColumns: [],
      droppedColumnsVerified: true,
      notes: ['Escenario sin rúbrica requerida de canvas.'],
    };
  }

  const entities: AiSuggestedEntity[] = result.actions?.entities || result.suggestedEntities || [];
  const mutations: AiEntityMutation[] = result.actions?.mutatedEntities || result.mutatedEntities || [];

  const createdTableNames = entities.map((e) => normalize(e.tableName));
  const mutatedTableNames = mutations.map((m) => normalize(m.targetTableName));
  const allTouchedTables = new Set([...createdTableNames, ...mutatedTableNames]);

  // 1. Evaluar tablas esperadas
  const expectedTables = rubric.expectedTables || [];
  const matchedTables: string[] = [];
  const missingTables: string[] = [];

  for (const t of expectedTables) {
    const tNorm = normalize(t);
    const found = Array.from(allTouchedTables).some((table) => table.includes(tNorm) || tNorm.includes(table));
    if (found) {
      matchedTables.push(t);
    } else {
      missingTables.push(t);
    }
  }

  // 2. Evaluar columnas esperadas (nuevas o en mutaciones ADD/MODIFY)
  const matchedColumns: string[] = [];
  const missingColumns: string[] = [];

  if (rubric.expectedColumns) {
    for (const [table, cols] of Object.entries(rubric.expectedColumns)) {
      const tableNorm = normalize(table);
      const entityMatch = entities.find((e) => normalize(e.tableName) === tableNorm);
      const mutationMatch = mutations.find((m) => normalize(m.targetTableName) === tableNorm);

      const entityCols = entityMatch ? entityMatch.columns.map((c) => normalize(c.name)) : [];
      const mutationCols = mutationMatch && mutationMatch.columnMutations
        ? mutationMatch.columnMutations
            .filter((cm) => cm.type === 'ADD' || cm.type === 'MODIFY')
            .map((cm) => normalize(cm.column.name))
        : [];

      const availableCols = new Set([...entityCols, ...mutationCols]);

      for (const col of cols) {
        const colNorm = normalize(col);
        if (availableCols.has(colNorm) || Array.from(availableCols).some((c) => c.includes(colNorm))) {
          matchedColumns.push(`${table}.${col}`);
        } else {
          missingColumns.push(`${table}.${col}`);
        }
      }
    }
  }

  // 3. Evaluar columnas eliminadas esperadas (DROP)
  let droppedColumnsVerified = true;
  if (rubric.expectedDroppedColumns) {
    for (const [table, cols] of Object.entries(rubric.expectedDroppedColumns)) {
      const tableNorm = normalize(table);
      const mutationMatch = mutations.find((m) => normalize(m.targetTableName) === tableNorm);
      const droppedInMutation = mutationMatch && mutationMatch.columnMutations
        ? mutationMatch.columnMutations
            .filter((cm) => cm.type === 'DROP')
            .map((cm) => normalize(cm.column.name))
        : [];

      for (const col of cols) {
        const colNorm = normalize(col);
        const wasDropped = droppedInMutation.includes(colNorm);
        if (!wasDropped) {
          droppedColumnsVerified = false;
          notes.push(`Faltó mutación DROP para la columna obsoleta "${table}.${col}".`);
        } else {
          notes.push(`Columna obsoleta "${table}.${col}" eliminada correctamente vía DROP.`);
        }
      }
    }
  }

  // 4. Evaluar si la mutación esperada fue generada
  if (rubric.expectedMutations) {
    for (const em of rubric.expectedMutations) {
      const targetNorm = normalize(em.targetTableName);
      const foundMut = mutations.find(
        (m) => normalize(m.targetTableName) === targetNorm && m.action === em.action
      );
      if (foundMut) {
        notes.push(`Mutación esperada ${em.action} en "${em.targetTableName}" detectada.`);
      } else {
        notes.push(`No se generó la mutación esperada ${em.action} en "${em.targetTableName}".`);
      }
    }
  }

  // Cálculo de Score
  let score = 100;
  if (expectedTables.length > 0) {
    score -= (missingTables.length / expectedTables.length) * 40;
  }
  const totalExpectedCols = rubric.expectedColumns
    ? Object.values(rubric.expectedColumns).flat().length
    : 0;
  if (totalExpectedCols > 0) {
    score -= (missingColumns.length / totalExpectedCols) * 40;
  }
  if (!droppedColumnsVerified) {
    score -= 20;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const passed = score >= 70;

  return {
    passed,
    score,
    matchedTables,
    missingTables,
    matchedColumns,
    missingColumns,
    droppedColumnsVerified,
    notes,
  };
}

export function evaluateRequirements(
  result: AiChatResult,
  scenario: BenchmarkScenario
): RequirementsEvaluationDetail {
  const rubric = scenario.expectedRubric.requirements;
  const notes: string[] = [];

  if (!rubric) {
    return {
      passed: true,
      score: 100,
      rfCount: 0,
      rnfCount: 0,
      topicsCovered: [],
      topicsMissing: [],
      mutationsMatched: true,
      notes: ['Escenario sin requisitos requeridos.'],
    };
  }

  const reqs: AiSuggestedRequirement[] =
    result.actions?.requirements || result.suggestedRequirements || [];
  const reqMutations =
    result.actions?.mutatedRequirements || result.mutatedRequirements || [];

  const rfCount = reqs.filter((r) => r.type === 'RF').length;
  const rnfCount = reqs.filter((r) => r.type === 'RNF').length;

  const corpus = normalize(
    [
      ...reqs.map((r) => `${r.title} ${r.description || ''}`),
      ...reqMutations.map(
        (m) =>
          `${m.targetCode} ${m.rationale} ${m.updatedFields?.title || ''} ${m.updatedFields?.description || ''}`
      ),
    ].join(' ')
  );

  const topicsCovered: string[] = [];
  const topicsMissing: string[] = [];

  for (const topic of rubric.keyTopics) {
    const tNorm = normalize(topic);
    if (corpus.includes(tNorm)) {
      topicsCovered.push(topic);
    } else {
      topicsMissing.push(topic);
    }
  }

  let mutationsMatched = true;
  if (rubric.expectedMutations) {
    for (const em of rubric.expectedMutations) {
      const match = reqMutations.find(
        (m) => normalize(m.targetCode) === normalize(em.targetCode) && m.action === em.action
      );
      if (!match) {
        mutationsMatched = false;
        notes.push(`Faltó mutación de requisito ${em.action} en ${em.targetCode}.`);
      }
    }
  }

  let score = 100;
  if (rubric.minRfCount && rfCount < rubric.minRfCount) {
    score -= (rubric.minRfCount - rfCount) * 15;
  }
  if (rubric.minRnfCount && rnfCount < rubric.minRnfCount) {
    score -= (rubric.minRnfCount - rnfCount) * 15;
  }
  if (rubric.keyTopics.length > 0) {
    const topicRatio = topicsCovered.length / rubric.keyTopics.length;
    score = score * 0.4 + topicRatio * 60;
  }
  if (!mutationsMatched) {
    score -= 20;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const passed = score >= 70;

  return {
    passed,
    score,
    rfCount,
    rnfCount,
    topicsCovered,
    topicsMissing,
    mutationsMatched,
    notes,
  };
}

export function evaluateDecisions(
  result: AiChatResult,
  scenario: BenchmarkScenario
): DecisionsEvaluationDetail {
  const rubric = scenario.expectedRubric.decisions;
  const notes: string[] = [];

  if (!rubric) {
    return {
      passed: true,
      score: 100,
      adrCount: 0,
      foundKeywords: [],
      missingKeywords: [],
      isProposedStatus: true,
      notes: ['Escenario sin decisiones requeridas.'],
    };
  }

  const decisions: AiSuggestedDecision[] =
    result.actions?.decisions || result.suggestedDecisions || [];
  const adrCount = decisions.length;

  const corpus = normalize(
    decisions
      .map((d) => `${d.title} ${d.context} ${d.decision} ${d.consequences || ''}`)
      .join(' ')
  );

  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of rubric.expectedKeywords) {
    const kwNorm = normalize(kw);
    if (corpus.includes(kwNorm)) {
      foundKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  let score = 100;
  if (adrCount === 0 && (rubric.minAdrCount ?? 1) > 0) {
    score = 0;
    notes.push('No se generaron actas ADR para la decisión requerida.');
  } else {
    if (rubric.expectedKeywords.length > 0) {
      const ratio = foundKeywords.length / rubric.expectedKeywords.length;
      score = Math.round(ratio * 100);
    }
  }

  score = Math.max(0, Math.min(100, score));
  const passed = score >= 60;

  return {
    passed,
    score,
    adrCount,
    foundKeywords,
    missingKeywords,
    isProposedStatus: true,
    notes,
  };
}

export function evaluateDiagrams(
  result: AiChatResult,
  scenario: BenchmarkScenario
): DiagramsEvaluationDetail {
  const rubric = scenario.expectedRubric.diagrams;
  const notes: string[] = [];

  if (!rubric) {
    return {
      passed: true,
      score: 100,
      hasDiagram: false,
      syntaxValid: true,
      foundKeywords: [],
      missingKeywords: [],
      notes: ['Escenario sin diagramas requeridos.'],
    };
  }

  const diagrams: AiSuggestedDiagram[] =
    result.actions?.diagrams || result.suggestedDiagrams || [];
  const hasDiagram = diagrams.length > 0;

  if (!hasDiagram) {
    return {
      passed: false,
      score: 0,
      hasDiagram: false,
      syntaxValid: false,
      foundKeywords: [],
      missingKeywords: rubric.requiredMermaidKeywords,
      notes: ['No se detectó ningún diagrama Mermaid en la respuesta del modelo.'],
    };
  }

  const diagram = diagrams[0];
  const rawCode = (diagram.mermaidCode || '').toLowerCase().trim();
  const codeNorm = normalize(rawCode);

  // Validar sintaxis básica de apertura Mermaid
  const syntaxValid =
    rawCode.startsWith('sequencediagram') ||
    rawCode.startsWith('statediagram') ||
    rawCode.startsWith('classdiagram') ||
    rawCode.startsWith('erdiagram') ||
    rawCode.startsWith('flowchart') ||
    rawCode.startsWith('graph') ||
    rawCode.startsWith('c4context');

  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of rubric.requiredMermaidKeywords) {
    const kwNorm = normalize(kw);
    if (codeNorm.includes(kwNorm)) {
      foundKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  let score = 100;
  if (!syntaxValid) {
    score -= 40;
    notes.push('La sintaxis del diagrama Mermaid no comienza con una cabecera canónica válida.');
  }

  if (rubric.requiredMermaidKeywords.length > 0) {
    const ratio = foundKeywords.length / rubric.requiredMermaidKeywords.length;
    score = score * 0.4 + ratio * 60;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const passed = score >= 60;

  return {
    passed,
    score,
    hasDiagram,
    syntaxValid,
    foundKeywords,
    missingKeywords,
    notes,
  };
}

export function evaluateScenario(
  result: AiChatResult,
  scenario: BenchmarkScenario,
  executionTimeMs: number
): EvaluationResult {
  const canvasDetail = evaluateCanvas(result, scenario);
  const reqsDetail = evaluateRequirements(result, scenario);
  const decisionsDetail = evaluateDecisions(result, scenario);
  const diagramsDetail = evaluateDiagrams(result, scenario);

  // Ponderación dinámica adaptada a las categorías presentes en la rúbrica
  const rubric = scenario.expectedRubric;
  let totalWeight = 0;
  let weightedSum = 0;

  if (rubric.canvas) {
    const w = 35;
    totalWeight += w;
    weightedSum += canvasDetail.score * w;
  }
  if (rubric.requirements) {
    const w = 25;
    totalWeight += w;
    weightedSum += reqsDetail.score * w;
  }
  if (rubric.decisions) {
    const w = 20;
    totalWeight += w;
    weightedSum += decisionsDetail.score * w;
  }
  if (rubric.diagrams) {
    const w = 20;
    totalWeight += w;
    weightedSum += diagramsDetail.score * w;
  }

  const affinityScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;

  // Generar feedback accionable
  const feedback: string[] = [];
  if (canvasDetail.missingColumns.length > 0) {
    feedback.push(`Canvas: Faltan las columnas ${canvasDetail.missingColumns.join(', ')}.`);
  }
  if (!canvasDetail.droppedColumnsVerified) {
    feedback.push('Canvas: La IA no ejecutó el DROP de las columnas obsoletas solicitadas.');
  }
  if (reqsDetail.topicsMissing.length > 0) {
    feedback.push(`Requisitos: No se abordaron los temas clave ${reqsDetail.topicsMissing.join(', ')}.`);
  }
  if (decisionsDetail.missingKeywords.length > 0) {
    feedback.push(`Decisiones ADR: El acta carece de conceptos esperados (${decisionsDetail.missingKeywords.join(', ')}).`);
  }
  if (diagramsDetail.missingKeywords.length > 0) {
    feedback.push(`Diagrama: Faltan componentes o interacciones esperadas en Mermaid (${diagramsDetail.missingKeywords.join(', ')}).`);
  }
  if (feedback.length === 0) {
    feedback.push('Cumplimiento técnico sobresaliente frente a la rúbrica esperada.');
  }

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    provider: result.provider,
    model: result.model,
    executionTimeMs,
    affinityScore,
    breakdown: {
      canvas: canvasDetail,
      requirements: reqsDetail,
      decisions: decisionsDetail,
      diagrams: diagramsDetail,
    },
    feedback,
    rawResult: {
      reply: result.reply || result.content,
      actions: result.actions,
    },
  };
}
